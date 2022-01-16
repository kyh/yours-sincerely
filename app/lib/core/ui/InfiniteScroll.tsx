import { useState, useEffect } from "react";
import { useFetcher } from "remix";
import useInfiniteScrollHook from "react-infinite-scroll-hook";

type Props<T> = {
  initialData: T;
  fetcherResultKey?: string;
};

export const useInfiniteScroll = <T,>({
  initialData,
  fetcherResultKey,
}: Props<T>) => {
  const fetcher = useFetcher();
  const [data, setData] = useState<any>(initialData);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [sentryRef] = useInfiniteScrollHook({
    loading: fetcher.state !== "idle",
    hasNextPage,
    onLoadMore: () => {
      const cursor = data[data.length - 1].id;
      fetcher.submit(new URLSearchParams(`c=${cursor}`));
    },
    rootMargin: "0px 0px 100px 0px",
  });

  useEffect(() => {
    if (fetcher.data) {
      const dataArr = fetcherResultKey
        ? fetcher.data[fetcherResultKey as keyof typeof fetcher.data]
        : fetcher.data;

      setData((prevData: any) => [...prevData, ...(dataArr || [])]);

      if (dataArr.length < 5) {
        setHasNextPage(false);
      }
    }
  }, [fetcher.data]);

  return {
    fetcher,
    hasNextPage,
    ref: sentryRef,
    data: data as T,
  };
};
