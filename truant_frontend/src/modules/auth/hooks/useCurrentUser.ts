import {User} from "@/modules/auth/types";
import {authApi} from "@/modules/auth/services/authApi";
import {ApiError} from "@/libs/api/apiError";
import {useQuery} from "@tanstack/react-query";
import {authQueryKeys} from "@/modules/auth/queryKeys";


export const useCurrentUser = () => {
    return useQuery({
       queryKey: authQueryKeys.currentUser(),
       queryFn: authApi.currentUser,
       retry: (failureCount, error) => {
           if (error instanceof ApiError && error.status === 401) {
               return false
           }

           return failureCount < 1
       }
    })
}
