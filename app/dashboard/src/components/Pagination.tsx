import {
  Box,
  Button,
  ButtonGroup,
  chakra,
  HStack,
  Select,
  Text,
} from "@chakra-ui/react";
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "contexts/DashboardContext";
import { ChangeEvent, FC } from "react";
import { useTranslation } from "react-i18next";
import { setUsersPerPageLimitSize } from "utils/userPreferenceStorage";

const PrevIcon = chakra(ArrowLongLeftIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});
const NextIcon = chakra(ArrowLongRightIcon, {
  baseStyle: {
    w: 4,
    h: 4,
  },
});

export type PaginationType = {
  count: number;
  perPage: number;
  page: number;
  onChange?: (page: number) => void;
};

const MINIMAL_PAGE_ITEM_COUNT = 5;

/**
 * Generate numeric page items around current page.
 *   - Always include first and last page
 *   - Add ellipsis if needed
 */
function generatePageItems(total: number, current: number, width: number) {
  if (width < MINIMAL_PAGE_ITEM_COUNT) {
    throw new Error(
      `Must allow at least ${MINIMAL_PAGE_ITEM_COUNT} page items`
    );
  }
  if (width % 2 === 0) {
    throw new Error(`Must allow odd number of page items`);
  }
  if (total < width) {
    return [...new Array(total).keys()];
  }
  const left = Math.max(
    0,
    Math.min(total - width, current - Math.floor(width / 2))
  );
  const items: (string | number)[] = new Array(width);
  for (let i = 0; i < width; i += 1) {
    items[i] = i + left;
  }
  // replace non-ending items with placeholders
  if (items[0] > 0) {
    items[0] = 0;
    items[1] = "prev-more";
  }
  if (items[items.length - 1] < total - 1) {
    items[items.length - 1] = total - 1;
    items[items.length - 2] = "next-more";
  }
  return items;
}

export const Pagination: FC = () => {
  const {
    filters,
    onFilterChange,
    users: { total },
  } = useDashboard();
  const { limit: perPage, offset } = filters;

  const page = (offset || 0) / (perPage || 1);
  const noPages = Math.ceil(total / (perPage || 1));
  const pages = generatePageItems(noPages, page, 7);

  const changePage = (page: number) => {
    onFilterChange({
      ...filters,
      offset: page * (perPage as number),
    });
  };

  const handlePageSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      limit: parseInt(e.target.value),
    });
    setUsersPerPageLimitSize(e.target.value);
  };

  const { t } = useTranslation();

  return (
    <HStack
      justifyContent="space-between"
      py={4}
      px={4}
      w="full"
      display="flex"
      columnGap={{ lg: 4, md: 0 }}
      rowGap={{ md: 0, base: 4 }}
      flexDirection={{ md: "row", base: "column" }}
      borderTop="1px solid rgba(255, 255, 255, 0.08)"
      _light={{ borderTop: "1px solid rgba(0, 0, 0, 0.08)" }}
    >
      <Box order={{ base: 2, md: 1 }}>
        <HStack>
          <Select
            minW="60px"
            value={perPage}
            onChange={handlePageSizeChange}
            size="sm"
            borderRadius="12px"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            color="white"
            _light={{
              bg: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              color: "gray.900",
            }}
            _focus={{
              border: "1px solid rgba(102, 126, 234, 0.5)",
              boxShadow: "0 0 0 1px rgba(102, 126, 234, 0.3)",
            }}
          >
            <option>10</option>
            <option>20</option>
            <option>30</option>
          </Select>
          <Text whiteSpace={"nowrap"} fontSize="sm" color="gray.400" _light={{ color: "gray.600" }}>
            {t("itemsPerPage")}
          </Text>
        </HStack>
      </Box>

      <HStack spacing={1} order={{ base: 1, md: 2 }}>
        <Box
          as="button"
          onClick={page > 0 && noPages > 0 ? changePage.bind(null, page - 1) : undefined}
          opacity={page === 0 || noPages === 0 ? 0.4 : 1}
          cursor={page === 0 || noPages === 0 ? "not-allowed" : "pointer"}
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          px={3}
          py={1.5}
          fontSize="sm"
          color="white"
          transition="all 0.2s ease"
          display="flex"
          alignItems="center"
          gap={1}
          _hover={page === 0 || noPages === 0 ? {} : {
            bg: "rgba(255, 255, 255, 0.1)",
          }}
          _light={{
            bg: "rgba(255, 255, 255, 0.8)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            color: "gray.700",
            _hover: page === 0 || noPages === 0 ? {} : { bg: "rgba(255, 255, 255, 0.95)" },
          }}
        >
          <PrevIcon />
          {t("previous")}
        </Box>
        
        {pages.map((pageIndex) => {
          if (typeof pageIndex === "string")
            return (
              <Box
                key={pageIndex}
                px={3}
                py={1.5}
                fontSize="sm"
                color="gray.400"
              >
                ...
              </Box>
            );
          return (
            <Box
              key={pageIndex}
              as="button"
              onClick={changePage.bind(null, pageIndex)}
              bg={(pageIndex as number) === page 
                ? "rgba(102, 126, 234, 0.8)" 
                : "rgba(255, 255, 255, 0.05)"
              }
              borderRadius="12px"
              border="1px solid"
              borderColor={(pageIndex as number) === page 
                ? "rgba(102, 126, 234, 0.5)" 
                : "rgba(255, 255, 255, 0.1)"
              }
              px={3}
              py={1.5}
              fontSize="sm"
              fontWeight={(pageIndex as number) === page ? "600" : "normal"}
              color="white"
              transition="all 0.2s ease"
              _hover={{
                bg: (pageIndex as number) === page 
                  ? "rgba(102, 126, 234, 0.9)" 
                  : "rgba(255, 255, 255, 0.1)",
              }}
              _light={{
                bg: (pageIndex as number) === page 
                  ? "rgba(102, 126, 234, 0.8)" 
                  : "rgba(255, 255, 255, 0.8)",
                border: "1px solid",
                borderColor: (pageIndex as number) === page 
                  ? "rgba(102, 126, 234, 0.5)" 
                  : "rgba(0, 0, 0, 0.1)",
                color: (pageIndex as number) === page ? "white" : "gray.700",
              }}
            >
              {(pageIndex as number) + 1}
            </Box>
          );
        })}

        <Box
          as="button"
          onClick={page + 1 < noPages && noPages > 0 ? changePage.bind(null, page + 1) : undefined}
          opacity={page + 1 === noPages || noPages === 0 ? 0.4 : 1}
          cursor={page + 1 === noPages || noPages === 0 ? "not-allowed" : "pointer"}
          bg="rgba(255, 255, 255, 0.05)"
          borderRadius="12px"
          border="1px solid rgba(255, 255, 255, 0.1)"
          px={3}
          py={1.5}
          fontSize="sm"
          color="white"
          transition="all 0.2s ease"
          display="flex"
          alignItems="center"
          gap={1}
          _hover={page + 1 === noPages || noPages === 0 ? {} : {
            bg: "rgba(255, 255, 255, 0.1)",
          }}
          _light={{
            bg: "rgba(255, 255, 255, 0.8)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            color: "gray.700",
            _hover: page + 1 === noPages || noPages === 0 ? {} : { bg: "rgba(255, 255, 255, 0.95)" },
          }}
        >
          {t("next")}
          <NextIcon />
        </Box>
      </HStack>
    </HStack>
  );
};
