export interface ResourceItem {
  title: string;
  url: string;
  format: 'pdf' | 'zip' | 'web';
}

export interface ResourceCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  items: ResourceItem[];
}

export const WILDFIRE_RESOURCES: ResourceCategory[] = [
  {
    id: 'standards',
    title: 'Standards',
    icon: 'Award',
    color: '#E8412A',
    items: [
      { title: 'VioStorm LED Series', url: 'https://wildfirelighting.com/products/viostorm-uv-led-lighting-series/', format: 'web' },
      { title: 'Effects Master Series', url: 'https://wildfirelighting.com/products/effects-master-series/', format: 'web' },
      { title: 'UltraBlade Series', url: 'https://wildfirelighting.com/products/ultrablade-series/', format: 'web' },
      { title: 'SableLED Series', url: 'https://wildfirelighting.com/products/sablelux-sableled-lamps/', format: 'web' },
    ],
  },
  {
    id: 'tutorials',
    title: 'Tutorials',
    icon: 'GraduationCap',
    color: '#7C6BF0',
    items: [
      { title: 'The Science Behind UV', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3q0wjj9gdwnafz7658o7t', format: 'pdf' },
      { title: 'How Fluorescence Works', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/22zh805bh2vc1mrn8ayqm', format: 'pdf' },
      { title: 'Shedding Light on Luminescence', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/11ynb570bebcgikfl7e9r', format: 'pdf' },
      { title: 'The Wildfire Effect Explained', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/qi5cixgd1gcqfvwdzq3g0', format: 'pdf' },
      { title: 'Technologies That Produce UV Light', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/x5359e8luukhp77o4bdvz', format: 'pdf' },
      { title: 'The FLAME Formula', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/xifit4przm6vwjusachrk', format: 'pdf' },
      { title: 'Fluorescent Black Light Lamps', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ob3ayo95r015u2ijdkx1w', format: 'pdf' },
      { title: 'Shooting UV Effects', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/g7535od8ocm2yltx6rjf8', format: 'pdf' },
    ],
  },
  {
    id: 'safety',
    title: 'Safety Data',
    icon: 'ShieldAlert',
    color: '#F97316',
    items: [
      { title: 'VioStorm Optical Radiation Hazard Analysis', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/VioStorm-VS-120-Optical-Radiation-Hazard-Analysis.pdf', format: 'pdf' },
      { title: 'Wildfire Visible Luminescent Paints', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Visible-Luminescent-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Invisible Luminescent Paints', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Invisible-Luminescent-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Invisible Clear Colors', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Invisible-Clear-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Phosphorescent Paint', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Phosphorescent-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Water Dyes', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Water-Dyes.pdf', format: 'pdf' },
      { title: 'Wildfire Black Light Chalk', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Black-Light-Chalk.pdf', format: 'pdf' },
      { title: 'Wildfire Reducer', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Reducer.pdf', format: 'pdf' },
      { title: 'Wildfire Sheen Leveler', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/SDS-Wildfire-Sheen-Leveler.pdf', format: 'pdf' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Data',
    icon: 'FileBarChart',
    color: '#3B82F6',
    items: [
      { title: 'VioStorm VS-60 LED Series', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/gufcgtbx231a6ta0dp544', format: 'pdf' },
      { title: 'VioStorm VS-120 LED Series', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3cy7008omyagvkewy5y3d', format: 'pdf' },
      { title: 'UltraBlade LED Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/TDS-UltraBlade-LED-Series.zip', format: 'zip' },
      { title: 'Effects Master Energy Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/TDS_Effects_Master_Energy_215-077-08.pdf', format: 'pdf' },
      { title: 'Effects Master VHO Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/TDS_Effects_Master_VHO_215-075-06.pdf', format: 'pdf' },
      { title: 'Effects Master LED Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/TDS-Effects-Master-LED-Series.zip', format: 'zip' },
      { title: 'UltraRail Series', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3eyg0a816kqp0o62fuegq', format: 'pdf' },
      { title: 'BlueBar LED Series', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/mxo1agl3b2zygtuzvvvxt', format: 'pdf' },
      { title: 'SableLux Fluorescent BLB Lamps', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/p62xxspd8xo8n0jabf3m2', format: 'pdf' },
      { title: 'SableLED BLB Lamps', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/TDS-SableLED-LED-BLB-Series-215-070-01.pdf', format: 'pdf' },
      { title: 'Wildfire Luminescent Visible Paints', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/cjlvmm7jnbxyoy7k5bu0m', format: 'pdf' },
      { title: 'Wildfire Luminescent Invisible Paints', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/lk5do7hnmqgjo4146gxdr', format: 'pdf' },
      { title: 'Wildfire Invisible Clear Colors', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/TDS-Wildfire-Invisible-Clear-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Phosphorescent Paint', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/hiyaznzd9t90fd5xr60ro', format: 'pdf' },
      { title: 'Wildfire Reducer', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2i310k39le7efvf1xmcvf', format: 'pdf' },
      { title: 'Wildfire Sheen Leveler', url: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2npdgt1i8lukkqgufu0ey', format: 'pdf' },
      { title: 'Wildfire Water Dyes', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/TDS-Wildfire-Water-Dyes.pdf', format: 'pdf' },
    ],
  },
  {
    id: 'manuals',
    title: 'Operation Manuals',
    icon: 'BookOpen',
    color: '#22C55E',
    items: [
      { title: 'VioStorm LED Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/Manual-VioStorm-UV-LED-Series.zip', format: 'zip' },
      { title: 'UltraBlade LED Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/Manual-UltraBlade-LED-Series.zip', format: 'zip' },
      { title: 'Effects Master Energy Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/Manual_Effects_Master_Energy.pdf', format: 'pdf' },
      { title: 'Effects Master VHO Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/Manual_Effects_Master_VHO.pdf', format: 'pdf' },
      { title: 'Effects Master LED Series', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/Manual-Effects-Master-LED-Series.zip', format: 'zip' },
      { title: 'BlueBar LED Series', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/Manual-BlueBar-LED-Lighting-Series.pdf', format: 'pdf' },
      { title: 'SableLED BLB Lamps', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/Manual-SableLED-LED-BLB-Series.pdf', format: 'pdf' },
      { title: 'Wildfire Luminescent Visible Paints', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/Manual-Wildfire-Visible-Luminescent-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Luminescent Invisible Paints', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/Manual-Wildfire-Invisible-Luminescent-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Invisible Clear Colors', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/Manual-Wildfire-Invisible-Clear-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Phosphorescent Paint', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/Manual-Wildfire-Phosphorescent-Paint.pdf', format: 'pdf' },
      { title: 'Wildfire Sheen Leveler', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/Manual-Wildfire-Sheen-Leveler.pdf', format: 'pdf' },
    ],
  },
  {
    id: 'dmx',
    title: 'DMX Charts',
    icon: 'Settings2',
    color: '#9B6DFF',
    items: [
      { title: 'VioStorm LED Series Rev. 2.1', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/VioStorm-DMX-Chart-Rev-2.1.pdf', format: 'pdf' },
      { title: 'VioStorm LED Series Rev. 2.0', url: 'https://wildfirelighting.com/wp-content/uploads/2018/08/VioStorm_VS-120_Trias_Ver._2.0_DMX_Chart.pdf', format: 'pdf' },
      { title: 'VioStorm LED Series Rev. 1.3', url: 'https://wildfirelighting.com/wp-content/uploads/2018/09/VioStorm-VS-120-DMX-Chart-Rev-1.3.pdf', format: 'pdf' },
    ],
  },
  {
    id: 'drawings',
    title: 'CAD Drawings',
    icon: 'Ruler',
    color: '#3B9FE8',
    items: [
      { title: 'VioStorm LED Series CAD', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/CAD-VioStorm-UV-LED-Series.zip', format: 'zip' },
      { title: 'UltraBlade Series CAD', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/CAD-UltraBlade-LED-Series.zip', format: 'zip' },
      { title: 'Effects Master VHO Series CAD', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/CAD-Effects-Master-VHO.zip', format: 'zip' },
      { title: 'Effects Master Energy Series CAD', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/CAD-Effects-Master-Energy.zip', format: 'zip' },
      { title: 'Effects Master LED Series CAD', url: 'https://wildfirelighting.com/wp-content/uploads/2020/02/CAD-Effects-Master-LED-Series.zip', format: 'zip' },
    ],
  },
];
