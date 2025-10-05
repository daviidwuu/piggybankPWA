
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null | undefined;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface UseCollectionOptions<T> {
    initialData?: WithId<T>[];
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
    options?: UseCollectionOptions<T>
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null | undefined;

  const [data, setData] = useState<StateDataType>(options?.initialData ?? undefined);
  const [isLoading, setIsLoading] = useState<boolean>(!options?.initialData);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // If we have initial data, we're not in the initial loading state for this effect.
    if (!options?.initialData) {
        setIsLoading(true);
    }
    setError(null);

    // This is a type guard to check if we are dealing with a single document.
    if ('path' in memoizedTargetRefOrQuery && !('where' in memoizedTargetRefOrQuery)) {
        // It looks like a DocumentReference, which is not supported by useCollection.
        if ((memoizedTargetRefOrQuery as any).type !== 'collection') {
             const docPath = (memoizedTargetRefOrQuery as DocumentReference).path;
             const errorMessage = `useCollection was called with a DocumentReference (path: ${docPath}), but it only supports CollectionReference or Query. Use the useDoc hook for single documents.`;
             console.error(errorMessage);
             const callError = new Error(errorMessage);
             setError(callError);
             setData(null);
             setIsLoading(false);
             // We can't easily throw this to the boundary without a more complex setup.
             // Setting error state is the primary way to notify the component.
             return; // Stop further execution
        }
    }


    // Directly use memoizedTargetRefOrQuery as it's assumed to be the final query
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        // The original error was because `snapshot` was a DocumentSnapshot, which has no `.docs`
        // By adding the guard above, we ensure we only proceed if we have a query.
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // This logic extracts the path from either a ref or a query
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, options?.initialData]); // Re-run if the target query/reference changes.
  
  if(memoizedTargetRefOrQuery && !(memoizedTargetRefOrQuery as any).__memo) {
    // This check is problematic because useMemo doesn't add a property.
    // Consider removing or finding a better way to enforce memoization if it remains an issue.
    // For now, we rely on developer discipline.
  }
  
  return { data, isLoading, error };
}
