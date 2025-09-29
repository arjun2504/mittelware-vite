import { Anchor, Breadcrumbs, Center, Loader, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { BlockForm } from "./components/form/block";
import { RuleProvider } from "./components/form/context/rule";
import { HeaderForm } from "./components/form/header";
import { RedirectForm } from "./components/form/redirect";
import { ResponseForm } from "./components/form/response";
import { baseSchema } from "./components/form/schema/rule";
import { getRule, saveRule, syncRulesWithExtension } from "@/services/rules/rules";
import { notify } from "@/utils/notification";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Rule } from "@/types/rules";

const RuleForm = () => {
  const { id, ruleType } = useParams();
  const navigate = useNavigate();

  const ruleDetail = useQuery({
    queryFn: () => getRule(id, ruleType),
    queryKey: ['rule', id],
    refetchOnWindowFocus: false
  });

  const ruleSaveMutation = useMutation({
    mutationFn: saveRule,
    onSuccess: (data) => {
      notify('Rule was saved successfully', true);
      navigate(`/rules/${ruleType}/${data.id}`)
      syncRulesWithExtension().then(() => {
        navigate(`/rules/${data.type}/${data.id}`)
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
    if (ruleDetail.data) {
      return ruleDetail.data;
    }
    return {
      name: '',
      description: '',
      created_at: null,
      updated_at: null,
      created_by: null,
      type: (ruleType as Rule['type']) || 'block',
      url_pattern: '',
      advanced_filters: {
        methods: ['get'],
        resource_types: ['main_frame', 'xmlhttprequest'],
        initiator_domain: ''
      },
      config: {},
      is_enabled: true
    } as unknown as Rule;
  };

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: getInitialValues(),
    validate: zod4Resolver(baseSchema)
  });
  
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

  // Update form values when data loads
  useEffect(() => {
    if (ruleDetail.data) {
      form.setValues(ruleDetail.data);
      form.resetDirty();
      form.resetTouched();
    }
  }, [ruleDetail.data]);

  // Update form type when ruleType changes (for new rules)
  useEffect(() => {
    if (ruleType && !ruleDetail.data) {
      form.setFieldValue('type', ruleType as Rule['type']);
    }
  }, [ruleType, ruleDetail.data, form]);

  // Ensure type is set correctly on mount and when ruleType changes
  useEffect(() => {
    if (ruleType) {
      form.setFieldValue('type', ruleType as Rule['type']);
    }
  }, [ruleType, form]);

  const renderForm = () => {
    switch (ruleType) {
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

  return (
    <Stack p='xl'>
      <Breadcrumbs separator="/">
        <Anchor to='/rules' component={NavLink}>Rules</Anchor>
        {!isNaN(Number(id)) ? ruleDetail.data?.name : 'New Rule'}
      </Breadcrumbs>
      <RuleProvider form={form as any}>
        {!ruleDetail.isLoading ? (
          <form method="post" onSubmit={form.onSubmit(handleSubmit)}>
            {renderForm()}
          </form>
          ) : (
          <Center py='xl'>
            <Loader type="bars" />
          </Center>
        )}
      </RuleProvider>
    </Stack>
  )
}

export default RuleForm;
