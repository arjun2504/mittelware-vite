import { useNavigate, useSearchParams } from "react-router";
import { Group, Stack, Text, Breadcrumbs, Button, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaExchangeAlt } from "react-icons/fa";
import { MdBlock } from "react-icons/md";
import { FaPencil } from "react-icons/fa6";
import { LuHeading } from "react-icons/lu";
import { DataTable } from 'mantine-datatable';
import { useState, useEffect } from "react";
import { deleteRule, deleteRules, getRules, syncRulesWithExtension, toggleRule } from "@/services/rules/rules";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import type { Rule } from "@/types/rules";
import { notify } from "@/utils/notification";
import { CreateRule } from "./components/create-rule";
import { TableActions } from "@/components/table-actions/table-actions";
import RuleEmptyState from "./components/empty-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MomentAgo from "@/components/moment-ago/moment-ago";
import SkeletonList from "./components/skeleton/list";
import { useStore, type Store } from "@/store";
import ExtensionPausedAlert from "@/components/extension-status/extension-paused-alert";

const RulesList = () => {
  const [selectedRules, setSelectedRules] = useState<Rule[]>([]);
  const [isBulkDeleteOpen, bulkDeleteModalActions] = useDisclosure();
  const [params] = useSearchParams();
  const [page, setPage] = useState(Number(params.get('page')) || 1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { settings } = useStore() as Store;

  const PAGE_SIZE = 10;

  const rulesList = useQuery({
    queryFn: () => getRules(page, PAGE_SIZE),
    queryKey: ['rules', page],
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false
  });

  // Ensure page state is valid when data changes
  useEffect(() => {
    if (rulesList.data && 'count' in rulesList.data) {
      const maxPage = Math.ceil((rulesList.data as any).count / PAGE_SIZE);
      if (page > maxPage && maxPage > 0) {
        setPage(maxPage);
      }
    }
  }, [rulesList.data, PAGE_SIZE, page]);

  const getRuleType = (ruleType: string) => {
    let Icon = null;
    let label = '-';
    switch (ruleType) {
      case 'block':
        Icon = MdBlock;
        label = 'Blocked';
        break;
      case 'redirect':
        Icon = FaExchangeAlt;
        label = 'Redirected';
        break;
      case 'modify-headers':
        Icon = LuHeading;
        label = 'Header Modified'
        break;
      case 'modify-response':
        Icon = FaPencil;
        label = 'Response Modified'
        break;
      default:
        return '-';
    }
    return (
      <Group gap="xs" wrap='nowrap'>
        <Icon />
        <Text>{label}</Text>
      </Group>
    )
  }

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

  const resetPage = () => {
    setPage(1);
    navigate('?page=1');
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

  return (
    <Stack p='xl'>
      <Breadcrumbs separator="/">
        Rules
      </Breadcrumbs>
      <Group justify="space-between">
        <Group>
          <Title>Rules</Title>
        </Group>
        <Group>
          {selectedRules.length ? (
            <>
              <Text fw={600}>{selectedRules.length} {selectedRules.length === 1 ? 'rule' : 'rules'} selected</Text>
              <Button color='red' onClick={bulkDeleteModalActions.open}>Delete Rules</Button>
            </>
          ) : null}
          <CreateRule />
        </Group>
      </Group>
      {settings.isPaused && (<ExtensionPausedAlert />)}
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
        <SkeletonList rows={PAGE_SIZE} />
      ) : (
        <DataTable
          withTableBorder={false}
          className="border border-gray-200 [&_th]:bg-gray-100"
          records={(rulesList.data as any)?.data || []}
          highlightOnHover={true}
          striped
          horizontalSpacing='md'
          borderRadius='md'
          verticalSpacing='md'
          selectedRecords={selectedRules}
          onSelectedRecordsChange={setSelectedRules}
          onRowClick={(event) => navigate(`/rules/${event.record.type}/${event.record.id}`)}
          emptyState={<RuleEmptyState />}
          pinLastColumn={true}
          selectionColumnClassName="bg-white"
          // rowClassName="bg-white hover:cursor-pointer"
          rowClassName={() => "bg-white hover:cursor-pointer"}
          totalRecords={(rulesList.data as any)?.count || 0}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={handlePageChange}
          fetching={rulesList.isLoading}
          paginationText={({ from, to, totalRecords }) => `${from}-${to} of ${totalRecords}`}
          styles={{
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
                  <Text fw={600} w={200} truncate='end'>{record.name}</Text>
                  <Text c='dimmed' w={200} truncate='end'>{record.url_pattern}</Text>
                </Stack>
              )
            },
            {
              accessor: 'type',
              title: 'Type',
              render: (record: Rule) => getRuleType(record.type)
            },
            {
              accessor: 'updated_at',
              title: 'Last Modified',
              render: (record: Rule) => <MomentAgo datetime={record.updated_at} />
            },
            // {
            //   accessor: 'created_at',
            //   title: 'Created At',
            //   render: (record: Rule) => <MomentAgo datetime={record.updated_at} />
            // },
            { 
              accessor: 'actions', 
              title: 'Actions',
              cellsClassName: () => 'bg-white',
              titleClassName: 'bg-white',
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
      )}
    </Stack>
  )
}

export default RulesList;
