import { QueryClient } from "@tanstack/react-query";

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // não refaz a query ao voltar para a aba
      retry: 1, // tenta novamente apenas uma vez em caso de erro
      // staleTime 0 garante que os dados sejam sempre buscados novamente
      // após invalidateQueries (importante para o modo localStorage)
      staleTime: 0,
    },
  },
});
