import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/apiClient';

// Generic Fetch Hook with TanStack Query
export const usePortalData = (queryKey, endpoint, options = {}) => {
    return useQuery({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        queryFn: async () => {
            const res = await api.get(endpoint);
            return res.data;
        },
        staleTime: 1000 * 30, // 30 seconds fresh
        refetchOnWindowFocus: true,
        ...options
    });
};

// Generic Mutation Hook with automatic query invalidation
export const usePortalMutation = (mutationFn, invalidationKeys = [], options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSuccess: (data, variables, context) => {
            if (Array.isArray(invalidationKeys)) {
                invalidationKeys.forEach(key => {
                    queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
                });
            }
            if (options.onSuccess) options.onSuccess(data, variables, context);
        },
        onError: (err, variables, context) => {
            if (options.onError) options.onError(err, variables, context);
        },
        ...options
    });
};

export default {
    usePortalData,
    usePortalMutation
};
