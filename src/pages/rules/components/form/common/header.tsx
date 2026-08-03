import { Button, Card, Flex, Group, Select, Stack, Switch, Textarea, TextInput, Title } from "@mantine/core";
import { useState, useEffect } from "react";
import { useRuleContext } from "../context/rule";
import { useDisclosure } from "@mantine/hooks";
import { ConfirmDialog } from "@/components/confirm-dialog/confirm-dialog";
import { useNavigate } from "react-router";
import { cloneRule, deleteRule } from "@/services/rules/rules";
import { FaRegCopy, FaDownload } from "react-icons/fa6";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaRegSave } from "react-icons/fa";
import { notify } from "@/utils/notification";
import { useMutation } from "@tanstack/react-query";
import { RULE_TYPES } from "@/constants/rules/rules";
import type { Rule } from "@/types/rules";
import { downloadRulesAsJson } from "@/utils/rules";

const INTERCEPT_TYPE_OPTIONS = RULE_TYPES.map((rt) => ({ value: rt.type, label: rt.label }));

interface FormTitleProps {
  title?: string;
  selectedType: Rule['type'];
  onTypeChange: (type: Rule['type']) => void;
}

export function FormHeader(props: FormTitleProps) {
  const { title, selectedType, onTypeChange } = props;
  const rule = useRuleContext();
  const [isDescriptionShown, setIsDescriptionShown] = useState(!!rule.getInitialValues().description);
  const [copyName, setCopyName] = useState(`Copy of ${rule.getInitialValues().name}`);

  // Reset copyName when the rule changes (e.g., after navigation)
  useEffect(() => {
    setCopyName(`Copy of ${rule.getInitialValues().name}`);
  }, [rule.getInitialValues().name]);
  const [opened, { open, close }] = useDisclosure();
  const [isMakeCopyOpen, makeCopyAction] = useDisclosure();

  const navigate = useNavigate();

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => deleteRule(id),
    onSuccess: () => {
      notify('Rule was successfully deleted', true);
      close();
      navigate('/rules');
    },
    onError: (error) => {
      console.error('Failed to delete rule:', error);
      notify('There was a problem while deleting this rule', false);
    }
  });

  const cloneRuleMutation = useMutation({
    mutationFn: ({ rule, copyName }: { rule: any; copyName: string }) => 
      cloneRule(rule, copyName),
    onSuccess: (data) => {
      notify('Successfully created a copy of the rule', true);
      makeCopyAction.close();
      navigate(`/rules/${data.id}`);
    },
    onError: (error) => {
      console.error('Failed to clone rule:', error);
      notify('Rule could not be duplicated.', false);
      makeCopyAction.close();
    }
  });

  const onDelete = () => {
    const ruleId = rule.getValues().id;
    if (!ruleId) {
      notify('Cannot delete rule: ID not found', false);
      return;
    }
    deleteRuleMutation.mutate(ruleId);
  };

  const onCopy = () => {
    if (copyName.trim() !== '') {
      cloneRuleMutation.mutate({
        rule: rule.getInitialValues(),
        copyName
      });
    }
  }

  const onExport = () => {
    const values = rule.getValues();
    downloadRulesAsJson([values], `mittelware-rule-${values.name}`);
  }

  return (
    <>
      <Flex justify='space-between' align='center'>
        <Title order={2}>{title}</Title>
        <Group>
          <Switch
            onLabel='ON'
            offLabel='OFF'
            defaultChecked={rule.getInitialValues().is_enabled}
            size='lg'
            color='violet'
            className='!cursor-pointer'
            {...rule.getInputProps('is_enabled')}
            onToggle={(value) => {
              rule.setFieldValue('is_enabled', !value);
            }}
            withThumbIndicator={false}
          />
          {(() => {
            const ruleId = rule.getValues().id;
            return ruleId && !isNaN(ruleId);
          })() && (
            <Group>
              <Button
                type='button'
                variant='outline'
                onClick={makeCopyAction.open}
                leftSection={<FaRegCopy />}
                loading={cloneRuleMutation.isPending}
              >
                Make a copy
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={onExport}
                leftSection={<FaDownload />}
              >
                Export
              </Button>
              <Button
                type='button' 
                variant='light' 
                color='red' 
                onClick={open} 
                leftSection={<FaRegTrashCan />}
                loading={deleteRuleMutation.isPending}
              >
                Delete
              </Button>
            </Group>
          )}
          <Button type='submit' disabled={!rule.isDirty()} loading={rule.submitting} leftSection={<FaRegSave />}>Save Rule</Button>
        </Group>
      </Flex>
      <Card>
        <Stack gap='md' maw={480}>
          <Select
            label='Intercept Type'
            description='What should happen to matching requests'
            data={INTERCEPT_TYPE_OPTIONS}
            value={selectedType}
            onChange={(value) => value && onTypeChange(value as Rule['type'])}
            allowDeselect={false}
            withAsterisk
          />
          <TextInput
            label='Name'
            placeholder='Rule Name'
            key={rule.key('name')}
            withAsterisk
            {...rule.getInputProps('name')}
          />
          {isDescriptionShown ? (
            <Textarea
              label='Description'
              placeholder='Describe what does this rule do'
              key={rule.key('description')}
              {...rule.getInputProps('description')}
            />
          ) : (
            <Button variant='transparent' onClick={() => setIsDescriptionShown(true)} className='self-start' p={0}>Add a description</Button>
          )}
        </Stack>
      </Card>
      <ConfirmDialog
        isOpen={opened}
        onClose={close}
        title='Confirm Delete'
        message='Are you sure you want to delete the rule?'
        variant="danger"
        confirmLabel="Yes, delete"
        onConfirm={onDelete}
      />
      <ConfirmDialog
        isOpen={isMakeCopyOpen}
        onClose={makeCopyAction.close}
        title='Make a copy'
        confirmLabel="Create a copy"
        onConfirm={onCopy}
      >
        <TextInput
          label="Rule Name"
          value={copyName}
          onChange={(event) => setCopyName(event.currentTarget.value)}
        />
      </ConfirmDialog>
    </>
  )
}