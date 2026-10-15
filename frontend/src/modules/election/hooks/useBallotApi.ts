import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { electionApi } from "../api/electionApi";
import type {
  AmendmentPayload,
  ListParams,
  PositionPayload,
} from "../api/types";
import { electionQueryKeys } from "../queryKeys";

export const usePositions = (params: ListParams = {}) =>
  useQuery({
    queryKey: electionQueryKeys.positions.list(params),
    queryFn: () => electionApi.positions.list(params),
  });

export const useBallotMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: electionQueryKeys.positions.all(),
    });

  return {
    createPosition: useMutation({
      mutationFn: (payload: PositionPayload) =>
        electionApi.positions.create(payload),
      onSuccess: refresh,
    }),
    updatePosition: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: number;
        payload: Partial<PositionPayload>;
      }) => electionApi.positions.update(id, payload),
      onSuccess: refresh,
    }),
    removePosition: useMutation({
      mutationFn: electionApi.positions.remove,
      onSuccess: refresh,
    }),
    createCandidate: useMutation({
      mutationFn: ({
        positionId,
        name,
        photo,
      }: {
        positionId: number;
        name: string;
        photo: File | null;
      }) => electionApi.candidates.create(positionId, { name, photo }),
      onSuccess: refresh,
    }),
    updateCandidate: useMutation({
      mutationFn: ({
        id,
        name,
        photo,
        removePhoto,
      }: {
        id: number;
        name: string;
        photo: File | null;
        removePhoto: boolean;
      }) => electionApi.candidates.update(id, { name, photo, removePhoto }),
      onSuccess: refresh,
    }),
    removeCandidate: useMutation({
      mutationFn: electionApi.candidates.remove,
      onSuccess: refresh,
    }),
  };
};

export const useAmendments = (params: ListParams = {}) =>
  useQuery({
    queryKey: electionQueryKeys.amendments.list(params),
    queryFn: () => electionApi.amendments.list(params),
  });

export const useAmendmentMutations = () => {
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: electionQueryKeys.amendments.all(),
    });

  return {
    create: useMutation({
      mutationFn: (payload: AmendmentPayload) =>
        electionApi.amendments.create(payload),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: AmendmentPayload }) =>
        electionApi.amendments.update(id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: electionApi.amendments.remove,
      onSuccess: refresh,
    }),
  };
};
