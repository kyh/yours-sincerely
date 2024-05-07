"use client"

import { useEffect, useRef, useState } from "react";
import useInfiniteScrollHook from "react-infinite-scroll-hook";
import { action } from "./infinitescrollaction";

type Props<T> = {
  initialData: T;
};

export const useInfiniteScroll = <T,>({
  initialData,
}: Props<T>) => {
  const [displayData, setDisplayData] = useState<any>(initialData);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState("");
  const loadMore = async () => {
    setCursor(displayData[displayData.length - 1].id);
    await action(cursor);
  };

  const [sentryRef] = useInfiniteScrollHook({
    loading: loading,
    hasNextPage,
    onLoadMore: loadMore,
    rootMargin: "0px 0px 100px 0px",
  });

  useEffect(() => {
    action(cursor)
      .then(res => {
        if (res) {
          const dataArr = res;

          // setDisplayData((prevData: any) => [...prevData, ...(dataArr || [])]);
          setDisplayData((prevData: any) => [...new Set([...prevData, ...(dataArr || [])].map(JSON.stringify))].map(JSON.parse));

          if (dataArr.length < 5) {
            setHasNextPage(false);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      })
  }, [cursor])

  return {
    loadMore,
    hasNextPage,
    ref: sentryRef,
    data: displayData as T,
  };
};
