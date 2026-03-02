import { Text } from '@gravity-ui/uikit';

interface FileHistoryTabProps {
  history: any[];
}

export function FileHistoryTab({ history }: FileHistoryTabProps) {
    if (!history || history.length === 0) {
        return <Text color="secondary">No history records found.</Text>;
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-2xl mx-auto py-4">
             {history.map((h) => (
                 <div key={h._id} className="relative pl-8 pb-8 border-l border-indigo-500/20 last:border-0 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <Text variant="body-2" className="font-bold">{h.statusTo?.replace('_', ' ')}</Text>
                            <Text variant="caption-1" color="secondary">{new Date(h.createdAt).toLocaleString()}</Text>
                        </div>
                        <Text variant="caption-1" color="secondary">Changed by {h.changedBy?.name}</Text>
                        {h.notes && (
                            <div className="bg-indigo-500/5 p-3 rounded-xl mt-2 border border-indigo-500/10">
                                <Text variant="body-1" className="italic text-indigo-200/80">{h.notes}</Text>
                            </div>
                        )}
                    </div>
                 </div>
             ))}
        </div>
    );
}
