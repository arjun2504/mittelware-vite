import { Anchor, Breadcrumbs, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect, useState } from "react";
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router";
import { BlockForm } from "./components/form/block";
import { RuleProvider } from "./components/form/context/rule";
import { HeaderForm } from "./components/form/header";
import { RedirectForm } from "./components/form/redirect";
import { ResponseForm } from "./components/form/response";
import { FormHeader } from "./components/form/common/header";
import { AdvancedFilters } from "./components/form/common/advanced-filters";
import { ruleSchema } from "./components/form/schema/rule";
import { getRule, saveRule, syncRulesWithExtension } from "@/services/rules/rules";
import { notify } from "@/utils/notification";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Rule } from "@/types/rules";
import { DEFAULT_RULES } from "@/constants/rules/form";
import { RULE_TYPES } from "@/constants/rules/rules";
import FormSkeleton from "./components/skeleton/form";
import ExtensionAlert from "@/components/extension-status/extension-alert";
import { decodeUnicodeBase64 } from "@/utils/rules";

const RuleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [prefill] = useState<Partial<Rule> | null>(() => {
    const raw = searchParams.get('prefill');
    if (!raw) return null;
    try {
      return JSON.parse(decodeUnicodeBase64(raw));
    } catch {
      return null;
    }
  });

  const [selectedType, setSelectedType] = useState<Rule['type']>(prefill?.type ?? 'block');

  const ruleDetail = useQuery({
    queryFn: () => getRule(id),
    queryKey: ['rule', id],
    refetchOnWindowFocus: false
  });

  const ruleSaveMutation = useMutation({
    mutationFn: saveRule,
    onSuccess: (data) => {
      notify('Rule was saved successfully', true);
      navigate(`/rules/${data.id}`)
      syncRulesWithExtension().then(() => {
        navigate(`/rules/${data.id}`)
        form.setValues(data);
        form.resetDirty();
        form.resetTouched();
      })
    },
    onError: () => {
      notify('There was an error while submitting form', false);
    }
  });

  const getInitialValues = () => {
    if (!isNaN(Number(id)) && ruleDetail.data) {
      return ruleDetail.data;
    }
    return DEFAULT_RULES[prefill?.type ?? 'block'] as unknown as Rule;
  };

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: getInitialValues(),
    validate: zod4Resolver(ruleSchema)
  });

  // Apply prefilled values as a change against the blank baseline above (not as the
  // baseline itself), so the form is dirty from the start and Save Rule is enabled
  // right away instead of requiring the user to touch a field first.
  useEffect(() => {
    if (prefill?.type) {
      const defaults = DEFAULT_RULES[prefill.type] as unknown as Rule;
      form.setValues({
        ...defaults,
        ...prefill,
        advanced_filters: {
          ...defaults.advanced_filters,
          ...prefill.advanced_filters,
        },
      } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+S (or Cmd+S on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();

        // Get current form values and submit
        const values = form.getValues();
        handleSubmit(values);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [form]);

  // Update form values (and selected type) when data loads
  useEffect(() => {
    if (!isNaN(Number(id)) && ruleDetail.data) {
      form.setValues(ruleDetail.data);
      form.resetDirty();
      form.resetTouched();
      setSelectedType(ruleDetail.data.type);
    }
  }, [ruleDetail.data]);

  const handleTypeChange = (newType: Rule['type']) => {
    setSelectedType(newType);
    form.setFieldValue('type', newType);
    form.setFieldValue('config', DEFAULT_RULES[newType].config);
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'block':
        return <BlockForm />;
      case 'redirect':
        return <RedirectForm />;
      case 'modify-headers':
        return <HeaderForm />;
      case 'modify-response':
        return <ResponseForm />;
      default:
        return null;
    }
  };

  const handleSubmit = async (values: any) => {
    await ruleSaveMutation.mutate(values);
  };

  const formTitle = RULE_TYPES.find((rt) => rt.type === selectedType)?.formTitle;

  return (
    <Stack p='xl'>
      <Breadcrumbs separator="/">
        <Anchor to='/rules' component={NavLink}>Rules</Anchor>
        {!isNaN(Number(id)) ? ruleDetail.data?.name : 'New Rule'}
      </Breadcrumbs>
      <ExtensionAlert />
      <RuleProvider form={form as any}>
        {!ruleDetail.isLoading ? (
          <form method="post" onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap='md'>
              <FormHeader title={formTitle} selectedType={selectedType} onTypeChange={handleTypeChange} />
              {renderForm()}
              <AdvancedFilters />
            </Stack>
          </form>
          ) : (
          <FormSkeleton />
        )}
      </RuleProvider>
    </Stack>
  )
}

export default RuleForm;
