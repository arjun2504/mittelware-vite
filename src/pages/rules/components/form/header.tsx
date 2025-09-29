import { ActionIcon, Alert, Autocomplete, Button, Flex, Grid, InputDescription, InputLabel, SegmentedControl, Select, Stack, TextInput, Tooltip } from "@mantine/core";
import { AdvancedFilters } from "./common/advanced-filters";
import { URLInput } from "./common/url";
import { FormHeader } from "./common/header";
import { MODIFY_HEADER_ACTIONS, MODIFY_HEADER_KEYS, MODIFY_HEADER_TABS } from "@/constants/rules/form";
import { FcPlus } from "react-icons/fc";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { MdOutlineClose } from "react-icons/md";
import { generateUUID } from "@/utils/random";
import { useRuleContext } from "./context/rule";
import { useLocation } from "react-router";
import type { HeaderType } from "@/types/rules";
import { FaInfoCircle } from "react-icons/fa";

type HeaderTabType = 'request' | 'response';

// Custom debounce hook
const useDebounce = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<number | undefined>(undefined);
  
  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(callback, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export function HeaderForm() {
  const [currentHeaderTab, setCurrentHeaderTab] = useState<HeaderTabType>('request');
  const rule = useRuleContext();
  const location = useLocation();
  const [headers, setHeaders] = useState<{
    request: HeaderType[];
    response: HeaderType[];
  }>({
    request: rule.getInitialValues().config?.request || [],
    response: rule.getInitialValues().config?.response || []
  });

  // Debounced function to update form
  const debouncedUpdateForm = useDebounce(() => {
    rule.setFieldValue('config', headers);
  }, 300);

  // Update form with debounce when headers change
  useEffect(() => {
    debouncedUpdateForm();
  }, [headers, debouncedUpdateForm]);

  useEffect(() => {
    const initialHeaders = {
      request: rule.getInitialValues().config?.request || [],
      response: rule.getInitialValues().config?.response || []
    };
    
    setHeaders(initialHeaders);
    setCurrentHeaderTab('request');
  }, [location.pathname, rule.getInitialValues().config]);

  const onAddNewHeader = useCallback(() => {
    setHeaders(prev => ({
      ...prev,
      [currentHeaderTab]: [
        ...prev[currentHeaderTab],
        {
          id: generateUUID(),
          action: 'set',
          key: '',
          value: '',
        }
      ]
    }));
  }, [currentHeaderTab]);

  const onRemoveHeader = useCallback((index: number) => {
    setHeaders(prev => ({
      ...prev,
      [currentHeaderTab]: prev[currentHeaderTab].filter((_, i) => i !== index)
    }));
  }, [currentHeaderTab]);

  const onChange = useCallback((value: string | null = '', key: string, index: number) => {
    setHeaders(prev => ({
      ...prev,
      [currentHeaderTab]: prev[currentHeaderTab].map((header, i) => i === index ? ({
        ...header,
        [key]: value,
        ...key === 'action' && value === 'remove' && { value: '' }
      }) : header)
    }));
  }, [currentHeaderTab]);

  return (
    <Stack gap='md'>
      <FormHeader title='Modify Headers' />
      <URLInput />
      <Stack gap={4}>
        <InputLabel>Modify Headers</InputLabel>
        <InputDescription>Modifying both request headers and response headers for the matching URL will be applied</InputDescription>
        <Stack gap='md'>
          <SegmentedControl
            fullWidth={true}
            data={MODIFY_HEADER_TABS}
            onChange={(value) => setCurrentHeaderTab(value as HeaderTabType)}
            value={currentHeaderTab}
          />
          <Grid>
            {headers[currentHeaderTab].map((header, index) => (
              <Fragment key={header.id}>
                <Grid.Col span={2}>
                  <Select
                    defaultValue={header.action}
                    data={MODIFY_HEADER_ACTIONS}
                    onChange={(value) => onChange(value, 'action', index)}
                  />
                </Grid.Col>
                <Grid.Col span={5}>
                  <Autocomplete
                    placeholder='Header Key'
                    defaultValue={header.key}
                    onChange={(value) => onChange(value, 'key', index)}
                    data={MODIFY_HEADER_KEYS}
                  />
                </Grid.Col>
                <Grid.Col span={5}>
                  <Flex gap='md' align='center'>
                    <TextInput
                      placeholder='Header Value'
                      flex={1}
                      defaultValue={header.value}
                      onChange={(event) => onChange(event.currentTarget.value, 'value', index)}
                      disabled={header.action === 'remove'}
                      key={header.action}
                    />
                    <Tooltip label="Remove">
                      <ActionIcon variant='light' color='red' size='input-sm' onClick={() => onRemoveHeader(index)}>
                        <MdOutlineClose />
                      </ActionIcon>
                    </Tooltip>
                  </Flex>
                </Grid.Col>
              </Fragment>
            ))}
          </Grid>
          <Button
            leftSection={<FcPlus />}
            variant='transparent'
            fullWidth={false}
            justify='flex-start'
            className='!w-fit'
            onClick={onAddNewHeader}
          >Add new</Button>
        </Stack>
        <Alert title="Note" mt='lg' icon={<FaInfoCircle />}>
          The modified headers will not be visible in the browser's developer console due to limitations. However, the changes will be reflected in the actual response received by the client.
        </Alert>
      </Stack>
      <AdvancedFilters />
    </Stack>
  )
}
