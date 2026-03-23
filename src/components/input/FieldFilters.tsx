import {
  Button,
  Column,
  Grid,
  Icon,
  List,
  ListItem,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Row,
} from '@umami/react-zen';
import { endOfDay, subMonths } from 'date-fns';
import { useMemo, useState } from 'react';
import type { Key } from 'react';
import { Empty } from '@/components/common/Empty';
import { FilterRecord } from '@/components/common/FilterRecord';
import { useApi, useFields, useMessages, useMobile } from '@/components/hooks';
import { ChevronDown, ChevronRight, Plus } from '@/components/icons';
import { SESSION_PROPERTY_PREFIX } from '@/lib/params';

export interface FieldFiltersProps {
  websiteId: string;
  value?: { name: string; operator: string; value: string }[];
  exclude?: string[];
  onChange?: (data: any) => void;
}

export function FieldFilters({ websiteId, value, exclude = [], onChange }: FieldFiltersProps) {
  const { formatMessage, labels, messages } = useMessages();
  const { fields: staticFields } = useFields();
  const startDate = subMonths(endOfDay(new Date()), 6);
  const endDate = endOfDay(new Date());
  const { isMobile } = useMobile();
  const { get, useQuery } = useApi();

  const { data: propertiesData } = useQuery<any>({
    queryKey: ['websites:session-data:properties', { websiteId, startAt: +startDate, endAt: +endDate }],
    queryFn: () =>
      get(`/websites/${websiteId}/session-data/properties`, {
        startAt: +startDate,
        endAt: +endDate,
      }),
    enabled: !!websiteId,
  });

  const userPropertyFields = useMemo(() => {
    if (!propertiesData) return [];
    return propertiesData.map(({ propertyName }: { propertyName: string }) => ({
      name: `${SESSION_PROPERTY_PREFIX}${propertyName}`,
      type: 'string',
      label: propertyName,
    }));
  }, [propertiesData]);

  const allFields = useMemo(
    () => [...staticFields, ...userPropertyFields],
    [staticFields, userPropertyFields],
  );

  const [fieldsOpen, setFieldsOpen] = useState(true);
  const [propsOpen, setPropsOpen] = useState(true);

  const updateFilter = (name: string, props: Record<string, any>) => {
    onChange(value.map(filter => (filter.name === name ? { ...filter, ...props } : filter)));
  };

  const handleAdd = (name: Key) => {
    onChange(value.concat({ name: name.toString(), operator: 'eq', value: '' }));
  };

  const handleChange = (name: string, value: Key) => {
    updateFilter(name, { value });
  };

  const handleSelect = (name: string, operator: Key) => {
    updateFilter(name, { operator });
  };

  const handleRemove = (name: string) => {
    onChange(value.filter(filter => filter.name !== name));
  };

  const renderFieldItem = (
    field: { name: string; label: string },
    Component: typeof ListItem | typeof MenuItem,
  ) => {
    const isDisabled = !!value.find(({ name }) => name === field.name);
    return (
      <Component key={field.name} id={field.name} isDisabled={isDisabled}>
        {field.label}
      </Component>
    );
  };

  return (
    <Grid columns={{ xs: '1fr', md: '200px 1fr' }} overflow="hidden" gapY="6">
      <Row display={{ xs: 'flex', md: 'none' }}>
        <MenuTrigger>
          <Button>
            <Icon>
              <Plus />
            </Icon>
          </Button>
          <Popover placement={isMobile ? 'left' : 'bottom start'} shouldFlip>
            <Menu
              onAction={handleAdd}
              style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
            >
              <MenuItem id="__fields_header" isDisabled>
                <Row alignItems="center" gap="2">
                  <Icon size="sm">
                    {fieldsOpen ? <ChevronDown /> : <ChevronRight />}
                  </Icon>
                  <strong>{formatMessage(labels.fields)}</strong>
                </Row>
              </MenuItem>
              {fieldsOpen &&
                staticFields
                  .filter(({ name }) => !exclude.includes(name))
                  .map(field => renderFieldItem(field, MenuItem))}
              {userPropertyFields.length > 0 && (
                <>
                  <MenuItem id="__user_properties_header" isDisabled>
                    <Row alignItems="center" gap="2">
                      <Icon size="sm">
                        {propsOpen ? <ChevronDown /> : <ChevronRight />}
                      </Icon>
                      <strong>{formatMessage(labels.userProperties)}</strong>
                    </Row>
                  </MenuItem>
                  {propsOpen &&
                    userPropertyFields.map(field => renderFieldItem(field, MenuItem))}
                </>
              )}
            </Menu>
          </Popover>
        </MenuTrigger>
      </Row>
      <Column
        display={{ xs: 'none', md: 'flex' }}
        border="right"
        paddingRight="3"
        marginRight="6"
        style={{ overflowY: 'auto', maxHeight: '500px' }}
      >
        <Column>
          <Row
            alignItems="center"
            gap="2"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setFieldsOpen(prev => !prev)}
          >
            <Icon size="sm">
              {fieldsOpen ? <ChevronDown /> : <ChevronRight />}
            </Icon>
            <strong>{formatMessage(labels.fields)}</strong>
          </Row>
          {fieldsOpen && (
            <List onAction={handleAdd}>
              {staticFields
                .filter(({ name }) => !exclude.includes(name))
                .map(field => renderFieldItem(field, ListItem))}
            </List>
          )}
        </Column>
        {userPropertyFields.length > 0 && (
          <Column>
            <Row
              alignItems="center"
              gap="2"
              style={{ cursor: 'pointer', userSelect: 'none', marginTop: '0.5rem' }}
              onClick={() => setPropsOpen(prev => !prev)}
            >
              <Icon size="sm">
                {propsOpen ? <ChevronDown /> : <ChevronRight />}
              </Icon>
              <strong>{formatMessage(labels.userProperties)}</strong>
            </Row>
            {propsOpen && (
              <List onAction={handleAdd}>
                {userPropertyFields.map(field => renderFieldItem(field, ListItem))}
              </List>
            )}
          </Column>
        )}
      </Column>
      <Column overflow="auto" gapY="4" style={{ contain: 'layout' }}>
        {value.map(filter => {
          return (
            <FilterRecord
              key={filter.name}
              websiteId={websiteId}
              type={filter.name}
              startDate={startDate}
              endDate={endDate}
              fields={allFields}
              {...filter}
              onSelect={handleSelect}
              onRemove={handleRemove}
              onChange={handleChange}
            />
          );
        })}
        {!value.length && <Empty message={formatMessage(messages.nothingSelected)} />}
      </Column>
    </Grid>
  );
}
