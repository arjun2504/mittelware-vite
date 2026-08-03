import { useNavigate, useSearchParams } from "react-router";
import { Group, Stack, Text, Breadcrumbs, Button, Title, Chip, Card, Select, useMantineColorScheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaPlus, FaPencil, FaDownload, FaUpload } from "react-icons/fa6";
import { MdBlock } from "react-icons/md";
import { LuHeading } from "react-icons/lu";
import { FaExchangeAlt } from "react-icons/fa";
import type { IconType } from "react-icons";
import { DataTable } from 'mantine-datatable';
import { useState, useEffect, useRef } from "react";
import { deleteRule, deleteRules, getRules, importRules, syncRulesWithExtension, toggleRule } from "@/services/rules/rules";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import type { Rule } from "@/types/rules";
import { notify } from "@/utils/notification";
import { downloadRulesAsJson } from "@/utils/rules";
import { TableActions } from "@/components/table-actions/table-actions";
import RuleEmptyState from "./components/empty-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MomentAgo from "@/components/moment-ago/moment-ago";
import SkeletonList from "./components/skeleton/list";
import ExtensionAlert from "@/components/extension-status/extension-alert";
import { RULE_TYPES } from "@/constants/rules/rules";

const RULE_TYPE_ICONS: Record<string, IconType> = {
  block: MdBlock,
  redirect: FaExchangeAlt,
  'modify-headers': LuHeading,
  'modify-response': FaPencil,
};

const PAGE_SIZE_OPTIONS = [
  { value: '25', label: '25 items' },
  { value: '50', label: '50 items' },
  { value: '75', label: '75 items' },
  { value: '100', label: '100 items' },
];

const getRuleTypeBadge = (type: string) => {
  const meta = RULE_TYPES.find((rt) => rt.type === type);
  const Icon = RULE_TYPE_ICONS[type];
  if (!meta || !Icon) return '-';
  return (
    <Group gap="xs" wrap='nowrap'>
      <Icon />
      <Text size='sm'>{meta.label}</Text>
    </Group>
  );
};

const RulesList = () => {
  const [selectedType, setSelectedType] = useState<Rule['type'] | undefined>(undefined);
  const [selectedRules, setSelectedRules] = useState<Rule[]>([]);
  const [isBulkDeleteOpen, bulkDeleteModalActions] = useDisclosure();
  const [params] = useSearchParams();
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const DEFAULT_PAGE_SIZE = 50;

  const [pageSizeOption, setPageSizeOption] = useState<string>(String(DEFAULT_PAGE_SIZE));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = Number(pageSizeOption);

  const rulesList = useQuery({
    queryFn: () => getRules(page, pageSize, selectedType),
    queryKey: ['rules', selectedType, page, pageSize],
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false
  });

  // Ensure page state is valid when data changes
  useEffect(() => {
    if (rulesList.data && 'count' in rulesList.data) {
      const maxPage = Math.ceil((rulesList.data as any).count / pageSize);
      if (page > maxPage && maxPage > 0) {
        setPage(maxPage);
      }
    }
  }, [rulesList.data, pageSize, page]);

  const onPageSizeChange = (value: string | null) => {
    if (!value) return;
    setPageSizeOption(value);
    setPage(1);
    navigate('?page=1');
  }

  const onFilterChange = (value: string) => {
    setSelectedType(value === 'all' ? undefined : value as Rule['type']);
    setPage(1);
    navigate('?page=1');
  };

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) =>
      toggleRule(id, !isEnabled),
    onSuccess: async () => {
      await syncRulesWithExtension();
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
    onError: (error) => {
      console.error('Failed to toggle rule:', error);
      notify('Failed to toggle rule status', false);
    }
  });


  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => deleteRule(id),
    onSuccess: async () => {
      await syncRulesWithExtension();
      notify('Rule deleted successfully', true);
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      resetPage();
    },
    onError: (error) => {
      console.error('Failed to delete rule:', error);
      notify('There was an error while deleting this rule', false);
    }
  });

  const deleteRulesMutation = useMutation({
    mutationFn: (ruleIds: number[]) => deleteRules(ruleIds),
    onSuccess: async () => {
      await syncRulesWithExtension();
      notify('Selected Rule(s) were deleted successfully', true);
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      resetPage();
      setSelectedRules([]);
      bulkDeleteModalActions.close();
    },
    onError: (error) => {
      console.error('Failed to delete rules:', error);
      notify('There was an error while deleting rules', false);
    }
  });

  const importRulesMutation = useMutation({
    mutationFn: (rawRules: unknown[]) => importRules(rawRules),
    onSuccess: async ({ imported, failed }) => {
      await syncRulesWithExtension();
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      if (imported > 0) {
        notify(`Imported ${imported} rule${imported === 1 ? '' : 's'}${failed ? `, ${failed} skipped` : ''}`, true);
      } else {
        notify('No valid rules found in the selected file', false);
      }
    },
    onError: (error) => {
      console.error('Failed to import rules:', error);
      notify('There was an error while importing rules', false);
    }
  });

  const resetPage = () => {
    setPage(1);
    navigate('?page=1');
  }

  const onExport = () => {
    downloadRulesAsJson(selectedRules);
  }

  const onImportClick = () => {
    fileInputRef.current?.click();
  }

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rawRules = Array.isArray(parsed) ? parsed : parsed?.rules;
      if (!Array.isArray(rawRules) || rawRules.length === 0) {
        notify('No rules found in the selected file', false);
        return;
      }
      importRulesMutation.mutate(rawRules);
    } catch (error) {
      console.error('Failed to parse import file:', error);
      notify('Invalid or corrupted rule file', false);
    }
  }

  const onToggleRuleStatus = (id: number, isEnabled: boolean) => {
    toggleRuleMutation.mutate({ id, isEnabled });
  }


  const onDelete = (id: number) => {
    deleteRuleMutation.mutate(id);
  }

  const onDeleteRules = () => {
    const ruleIds = selectedRules.map((rule) => rule.id).filter((id): id is number => id !== undefined);
    deleteRulesMutation.mutate(ruleIds);
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const searchParams = new URLSearchParams();
    searchParams.set('page', newPage.toString());
    navigate(`?${searchParams.toString()}`);
  }

  const records = (rulesList.data as any)?.data || [];

  return (
    <Stack p='lg' gap='sm'>
      <Breadcrumbs separator="/">
        <Text size='sm' c='dimmed'>Rules</Text>
      </Breadcrumbs>
      <ExtensionAlert />
      <Group justify="space-between">
        <Group>
          <Title order={2}>Rules</Title>
        </Group>
        <Group>
          {selectedRules.length ? (
            <>
              <Text fw={600} size='sm'>{selectedRules.length} {selectedRules.length === 1 ? 'rule' : 'rules'} selected</Text>
              <Button color='red' onClick={bulkDeleteModalActions.open}>Delete Rules</Button>
              <Button variant='outline' leftSection={<FaDownload size={12} />} onClick={onExport}>
                Export
              </Button>
            </>
          ) : null}
          <Select
            data={PAGE_SIZE_OPTIONS}
            value={pageSizeOption}
            onChange={onPageSizeChange}
            allowDeselect={false}
            w={130}
          />
          <Button
            variant='outline'
            leftSection={<FaUpload size={12} />}
            onClick={onImportClick}
            loading={importRulesMutation.isPending}
          >
            Import
          </Button>
          <input
            ref={fileInputRef}
            type='file'
            accept='.json,application/json'
            hidden
            onChange={onFileSelected}
          />
          <Button variant='filled' leftSection={<FaPlus size={12} />} onClick={() => navigate('/rules/create')}>
            Create Rule
          </Button>
        </Group>
      </Group>
      <Chip.Group multiple={false} value={selectedType ?? 'all'} onChange={onFilterChange}>
        <Group gap='xs'>
          <Chip value='all' variant='filled' color='violet'>All</Chip>
          {RULE_TYPES.map((rt) => (
            <Chip key={rt.type} value={rt.type} variant='filled' color='violet'>{rt.label}</Chip>
          ))}
        </Group>
      </Chip.Group>
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={bulkDeleteModalActions.close}
        title='Confirm Delete'
        message='Are you sure you want to delete selected rule(s)?'
        variant="danger"
        confirmLabel="Yes, delete"
        onConfirm={onDeleteRules}
      />
      {rulesList.isLoading ? (
        <SkeletonList rows={DEFAULT_PAGE_SIZE} />
      ) : records.length === 0 ? (
        <RuleEmptyState />
      ) : (
        <Card p={0}>
          <DataTable
            withTableBorder={false}
            borderColor="transparent"
            backgroundColor="var(--mantine-color-default)"
            records={records}
            highlightOnHover={true}
            rowBackgroundColor={(_record, index) =>
              index % 2 === 1
                ? { light: 'var(--mantine-color-gray-0)', dark: 'var(--mantine-color-dark-6)' }
                : undefined
            }
            horizontalSpacing='md'
            borderRadius='md'
            verticalSpacing='sm'
            selectedRecords={selectedRules}
            onSelectedRecordsChange={setSelectedRules}
            onRowClick={(event) => navigate(`/rules/${event.record.id}`)}
            pinLastColumn={true}
            rowClassName={() => 'cursor-pointer'}
            totalRecords={(rulesList.data as any)?.count || 0}
            recordsPerPage={pageSize}
            page={page}
            onPageChange={handlePageChange}
            fetching={rulesList.isLoading}
            paginationText={({ from, to, totalRecords }) => `${from}-${to} of ${totalRecords}`}
            styles={{
              header: {
                backgroundColor: isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)',
              },
              pagination: {
                justifyContent: 'space-between',
                alignItems: 'center',
                display: 'flex'
              }
            }}
            columns={
            [
              {
                accessor: 'name',
                title: 'Name',
                ellipsis: true,
                render: (record: Rule) => (
                  <Stack gap={2}>
                    <Text fw={600} size='sm' w={220} truncate='end'>{record.name}</Text>
                    <Text ff='monospace' size='xs' c='dimmed' w={220} truncate='end'>{record.url_pattern}</Text>
                  </Stack>
                )
              },
              {
                accessor: 'type',
                title: 'Type',
                render: (record: Rule) => getRuleTypeBadge(record.type)
              },
              {
                accessor: 'updated_at',
                title: 'Last Modified',
                render: (record: Rule) => <MomentAgo datetime={record.updated_at} />
              },
              {
                accessor: 'actions',
                title: 'Actions',
                noWrap: true,
                render: (record: Rule) => (
                  <TableActions
                    record={record}
                    onToggle={onToggleRuleStatus}
                    onDelete={onDelete}
                  />
                )
              },
            ]
          }
        />
        </Card>
      )}
    </Stack>
  )
}

export default RulesList;
