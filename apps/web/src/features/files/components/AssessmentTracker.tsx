import { useState } from 'react';
import { Text, Button, Icon, Label, Card, Spin } from '@gravity-ui/uikit';
import { Check, Play } from '@gravity-ui/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../common/lib/api';

interface AssessmentNode {
  node: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  enteredAt?: string;
  completedAt?: string;
  notes?: string;
}

interface AssessmentTrackerProps {
  fileId: string;
  assessment: {
    currentNode?: string;
    nodes: AssessmentNode[];
  };
}

export function AssessmentTracker({ fileId, assessment }: AssessmentTrackerProps) {
  const queryClient = useQueryClient();
  const [updatingNode, setUpdatingNode] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: { node: string; status: string; notes?: string }) =>
      api.post(`/files/${fileId}/assessment`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', fileId] });
      setUpdatingNode(null);
    }
  });

  const handleUpdate = (node: string, currentStatus: string) => {
    setUpdatingNode(node);
    const nextStatus = currentStatus === 'PENDING' ? 'ACTIVE' : 
                       currentStatus === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE';
    
    mutation.mutate({ node, status: nextStatus });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <Text variant="subheader-2" className="font-bold">Customs Assessment Progression</Text>
        {assessment.currentNode && (
          <Label theme="info" size="m">Currently At: {assessment.currentNode}</Label>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {assessment.nodes.map((node, index) => {
          const isActive = node.status === 'ACTIVE';
          const isCompleted = node.status === 'COMPLETED';
          const isPending = node.status === 'PENDING';

          return (
            <Card 
              key={node.node} 
              className={`p-4 border transition-all ${
                isActive ? 'bg-indigo-500/10 border-indigo-500/30' : 
                isCompleted ? 'bg-green-500/5 border-green-500/20 opacity-80' : 
                'bg-[var(--g-color-base-generic-hover)] border-[var(--g-color-line-generic)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-indigo-500 text-white animate-pulse' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-[var(--g-color-base-selection)] text-[var(--g-color-text-secondary)]'
                  }`}>
                    {isCompleted ? <Icon data={Check} size={16} /> : 
                     isActive ? <Icon data={Play} size={14} /> : 
                     <Text variant="caption-2" className="font-bold">{index + 1}</Text>}
                  </div>
                  
                  <div>
                    <Text variant="body-2" className="font-bold block">{node.node}</Text>
                    {(node.enteredAt || node.completedAt) && (
                      <Text variant="caption-1" color="secondary">
                        {node.completedAt 
                          ? `Completed: ${new Date(node.completedAt).toLocaleString()}` 
                          : `Started: ${new Date(node.enteredAt!).toLocaleString()}`}
                      </Text>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {updatingNode === node.node ? (
                    <Spin size="s" />
                  ) : (
                    <Button 
                      view={isActive ? 'action' : 'flat'} 
                      size="s" 
                      onClick={() => handleUpdate(node.node, node.status)}
                    >
                      {isPending ? 'Start' : isActive ? 'Mark Done' : 'Re-open'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
