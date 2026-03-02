import { useState } from 'react';
import { Text, Button, TextInput, Card, Spin, Icon, Label } from '@gravity-ui/uikit';
import { Plus } from '@gravity-ui/icons';
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory } from '../../staff/hooks/useFinance';

export default function CategoryManagement() {
  const [newCatName, setNewCatName] = useState('');
  const { data: categories = [], isLoading } = useExpenseCategories();
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    createMutation.mutate({ name: newCatName.trim(), isActive: true }, {
      onSuccess: () => setNewCatName(''),
    });
  };

  const toggleStatus = (id: string, current: boolean) => {
    updateMutation.mutate({ id, isActive: !current } as any);
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Spin size="l" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-2xl flex flex-col gap-4">
        <Text variant="subheader-2" className="font-bold uppercase tracking-wider text-indigo-400">Add New Category</Text>
        <div className="flex gap-3">
          <TextInput
            size="xl"
            placeholder="e.g. PORT_CHARGES"
            className="flex-1"
            value={newCatName}
            onUpdate={setNewCatName}
          />
          <Button view="action" size="xl" onClick={handleAdd} loading={createMutation.isPending}>
            <Icon data={Plus} size={18} />
            Add Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <Card key={cat._id} view="raised" className="p-4 flex items-center justify-between border border-[var(--g-color-line-generic)] rounded-xl">
            <div className="flex flex-col gap-1">
              <Text variant="body-2" className="font-bold text-[16px]">{cat.name}</Text>
              <Label theme={cat.isActive ? 'success' : 'normal'} size="s">
                {cat.isActive ? 'Active' : 'Inactive'}
              </Label>
            </div>
            <Button
              view="flat-info"
              size="m"
              onClick={() => toggleStatus(cat._id, cat.isActive)}
              loading={updateMutation.isPending}
            >
              {cat.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
