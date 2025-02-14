import { Seo } from "@/components/Seo";
import { AnalyticsGraphContainer } from "@/features/analytics/components/AnalyticsGraphContainer";
import {
  defaultTimeFilter,
  type timeFilterValues,
} from "@/features/analytics/constants";
import { TypebotHeader } from "@/features/editor/components/TypebotHeader";
import { TypebotNotFoundPage } from "@/features/editor/components/TypebotNotFoundPage";
import { useTypebot } from "@/features/editor/providers/TypebotProvider";
import { useWorkspace } from "@/features/workspace/WorkspaceProvider";
import { toast } from "@/lib/toast";
import { trpc } from "@/lib/trpc";
import {
  Button,
  Flex,
  HStack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { ResultsProvider } from "../ResultsProvider";
import { ResultsTableContainer } from "./ResultsTableContainer";

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const ResultsPage = () => {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { typebot, publishedTypebot, is404 } = useTypebot();
  const isAnalytics = useMemo(
    () => router.pathname.endsWith("analytics"),
    [router.pathname],
  );
  const bgColor = useColorModeValue(
    router.pathname.endsWith("analytics") ? "#f4f5f8" : "white",
    router.pathname.endsWith("analytics") ? "gray.900" : "gray.950",
  );
  const [timeFilter, setTimeFilter] =
    useState<(typeof timeFilterValues)[number]>(defaultTimeFilter);

  const {
    data: { stats } = {},
    refetch,
  } = trpc.analytics.getStats.useQuery(
    {
      typebotId: publishedTypebot?.typebotId as string,
      timeFilter,
      timeZone,
    },
    {
      enabled: !!publishedTypebot,
      onError: (err) => toast({ description: err.message }),
    },
  );

  const handleDeletedResults = () => {
    if (!stats) return;
    refetch();
  };

  if (is404) return <TypebotNotFoundPage />;
  return (
    <Flex overflow="hidden" h="100vh" flexDir="column">
      <Seo
        title={
          router.pathname.endsWith("analytics")
            ? typebot?.name
              ? `${typebot.name} | Analytics`
              : "Analytics"
            : typebot?.name
              ? `${typebot.name} | Results`
              : "Results"
        }
      />
      <TypebotHeader />
      <Flex h="full" w="full" bgColor={bgColor}>
        <Flex
          pos="absolute"
          zIndex={2}
          w="full"
          justifyContent="center"
          h="60px"
          display={["none", "flex"]}
        >
          <HStack maxW="1600px" w="full" px="4">
            <Button
              as={Link}
              colorScheme={!isAnalytics ? "orange" : "gray"}
              variant={!isAnalytics ? "outline" : "ghost"}
              size="sm"
              href={`/typebots/${typebot?.id}/results`}
            >
              <Text>Submissions</Text>
              {(stats?.totalStarts ?? 0) > 0 && (
                <Tag size="sm" colorScheme="orange" ml="1">
                  {stats?.totalStarts}
                </Tag>
              )}
            </Button>
            <Button
              as={Link}
              colorScheme={isAnalytics ? "orange" : "gray"}
              variant={isAnalytics ? "outline" : "ghost"}
              href={`/typebots/${typebot?.id}/results/analytics`}
              size="sm"
            >
              Analytics
            </Button>
          </HStack>
        </Flex>
        <Flex pt={["10px", "60px"]} w="full" justify="center">
          {workspace &&
            publishedTypebot &&
            (isAnalytics ? (
              <AnalyticsGraphContainer
                stats={stats}
                timeFilter={timeFilter}
                onTimeFilterChange={setTimeFilter}
              />
            ) : (
              <ResultsProvider
                timeFilter={timeFilter}
                typebotId={publishedTypebot.typebotId}
                totalResults={stats?.totalStarts ?? 0}
                onDeleteResults={handleDeletedResults}
              >
                <ResultsTableContainer
                  timeFilter={timeFilter}
                  onTimeFilterChange={setTimeFilter}
                />
              </ResultsProvider>
            ))}
        </Flex>
      </Flex>
    </Flex>
  );
};
