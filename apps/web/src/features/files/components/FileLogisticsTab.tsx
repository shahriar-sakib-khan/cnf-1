import { Text, Icon } from '@gravity-ui/uikit';
import { Compass } from '@gravity-ui/icons';
import { formatMoney } from '../../../common/utils/money';

interface FileLogisticsTabProps {
  file: any;
}

export function FileLogisticsTab({ file }: FileLogisticsTabProps) {
  const items = [
    { label: 'Vessel Name', value: file.vesselName },
    { label: 'Voyage No', value: file.voyageNo },
    { label: 'Rotation No', value: file.rotationNo },
    { label: 'IGM Number', value: file.igmNo },
    { label: 'IGM Date', value: file.igmDate ? new Date(file.igmDate).toLocaleDateString() : null },
    { label: 'Arrival Date', value: file.arrivalDate ? new Date(file.arrivalDate).toLocaleDateString() : null },
    { label: 'B/E Number', value: file.boeNumber },
    { label: 'B/E Date', value: file.beDate ? new Date(file.beDate).toLocaleDateString() : null },
    { label: 'C Number', value: file.cNumber },
    { label: 'C Date', value: file.cDate ? new Date(file.cDate).toLocaleDateString() : null },
    { label: 'L/C Number', value: file.lcNumber },
    { label: 'L/C Date', value: file.lcDate ? new Date(file.lcDate).toLocaleDateString() : null },
    { label: 'PI Number', value: file.piNumber },
    { label: 'Origin', value: file.countryOfOrigin },
    { label: 'Container', value: file.containerType },
    { label: 'Pkg Type', value: file.packageType },
    { label: 'Assessment Val', value: file.assessmentValue ? `${formatMoney(file.assessmentValue)} (${file.currency})` : null },
    { label: 'D/O Status', value: file.deliveryOrderStatus ? 'RECEIVED' : 'PENDING' },
    { label: 'Gate Pass No', value: file.gatePassNo },
    { label: 'Quantity', value: file.quantity },
    { label: 'Weight', value: file.weight ? `${file.weight} KG` : null },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item) => (
           <div key={item.label} className="flex flex-col gap-1">
             <Text variant="caption-1" color="secondary">{item.label}</Text>
             <Text variant="body-2" className="font-bold">{item.value || '—'}</Text>
           </div>
        ))}
      </div>

      <div className="p-12 border-2 border-dashed border-[var(--g-color-line-generic)] rounded-2xl flex flex-col items-center justify-center text-center gap-3">
         <Icon data={Compass} size={48} className="text-[var(--g-color-text-secondary)] opacity-20" />
         <Text variant="subheader-2" color="secondary">Detailed tracking and port logs will appear here.</Text>
      </div>
    </div>
  );
}
