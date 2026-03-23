import { Button, Column, Grid, Icon, Label, ListItem, Select, TextField } from '@umami/react-zen';
import { useState } from 'react';
import { Empty } from '@/components/common/Empty';
import { useApi, useFilters, useFormat, useWebsiteValuesQuery } from '@/components/hooks';
import { X } from '@/components/icons';
import { getSessionPropertyKey, isSearchOperator, isSessionProperty } from '@/lib/params';

export interface FilterRecordProps {
  websiteId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  name: string;
  operator: string;
  value: string;
  fields?: { name: string; type: string; label: string }[];
  onSelect?: (name: string, value: any) => void;
  onRemove?: (name: string) => void;
  onChange?: (name: string, value: string) => void;
}

export function FilterRecord({
  websiteId,
  type,
  startDate,
  endDate,
  name,
  operator,
  value,
  fields: fieldsProp,
  onSelect,
  onRemove,
  onChange,
}: FilterRecordProps) {
  const { fields: defaultFields, operators } = useFilters();
  const fields = fieldsProp || defaultFields;
  const [selected, setSelected] = useState(value);
  const [search, setSearch] = useState('');
  const { formatValue } = useFormat();
  const { get, useQuery } = useApi();

  const propertyKey = isSessionProperty(name) ? getSessionPropertyKey(name) : undefined;

  const websiteValuesQuery = useWebsiteValuesQuery({
    websiteId: isSessionProperty(name) ? '' : websiteId,
    type,
    search,
    startDate,
    endDate,
  });

  const sessionDataValuesQuery = useQuery<any>({
    queryKey: [
      'websites:session-data:values',
      { websiteId, propertyName: propertyKey, startAt: +startDate, endAt: +endDate, search },
    ],
    queryFn: () =>
      get(`/websites/${websiteId}/session-data/values`, {
        startAt: +startDate,
        endAt: +endDate,
        propertyName: propertyKey,
        search,
      }),
    enabled: !!(isSessionProperty(name) && websiteId && propertyKey),
  });

  const { data, isLoading } = isSessionProperty(name)
    ? sessionDataValuesQuery
    : websiteValuesQuery;

  const isSearch = isSearchOperator(operator);
  const items = data?.filter(({ value }) => value) || [];

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleSelectOperator = (value: any) => {
    onSelect?.(name, value);
  };

  const handleSelectValue = (value: string) => {
    setSelected(value);
    onChange?.(name, value);
  };

  const renderValue = () => {
    return formatValue(selected, type);
  };

  return (
    <Column>
      <Label>{fields.find(f => f.name === name)?.label}</Label>
      <Grid columns="1fr auto" gap>
        <Grid columns={{ xs: '1fr', md: '200px 1fr' }} gap>
          <Select
            items={operators.filter(({ type }) => type === 'string')}
            value={operator}
            onChange={handleSelectOperator}
          >
            {({ name, label }: any) => {
              return (
                <ListItem key={name} id={name}>
                  {label}
                </ListItem>
              );
            }}
          </Select>
          {isSearch && (
            <TextField value={selected} defaultValue={selected} onChange={handleSelectValue} />
          )}
          {!isSearch && (
            <Select
              items={items}
              value={selected}
              onChange={handleSelectValue}
              searchValue={search}
              renderValue={renderValue}
              onSearch={handleSearch}
              isLoading={isLoading}
              listProps={{ renderEmptyState: () => <Empty /> }}
              allowSearch
            >
              {items?.map(({ value }) => {
                return (
                  <ListItem key={value} id={value}>
                    {formatValue(value, type)}
                  </ListItem>
                );
              })}
            </Select>
          )}
        </Grid>
        <Column justifyContent="flex-start">
          <Button onPress={() => onRemove?.(name)}>
            <Icon>
              <X />
            </Icon>
          </Button>
        </Column>
      </Grid>
    </Column>
  );
}
