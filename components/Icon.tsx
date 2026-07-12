import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { colors } from '../constants/theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const baseProps = (size: number, color: string, sw: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const MicIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Rect x="9" y="3" width="6" height="12" rx="3" />
    <Path d="M5 11a7 7 0 0 0 14 0" />
    <Line x1="12" y1="18" x2="12" y2="22" />
    <Line x1="8" y1="22" x2="16" y2="22" />
  </Svg>
);

export const PlayIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M6 4l14 8-14 8V4z" fill={color} />
  </Svg>
);

export const PauseIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Rect x="7" y="4" width="3.5" height="16" rx="1" fill={color} />
    <Rect x="13.5" y="4" width="3.5" height="16" rx="1" fill={color} />
  </Svg>
);

export const HomeIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z" />
  </Svg>
);

export const CalendarIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Rect x="3" y="5" width="18" height="16" rx="2" />
    <Line x1="3" y1="10" x2="21" y2="10" />
    <Line x1="8" y1="3" x2="8" y2="7" />
    <Line x1="16" y1="3" x2="16" y2="7" />
  </Svg>
);

export const ListIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Line x1="8" y1="6" x2="20" y2="6" />
    <Line x1="8" y1="12" x2="20" y2="12" />
    <Line x1="8" y1="18" x2="20" y2="18" />
    <Circle cx="4" cy="6" r="1.5" fill={color} />
    <Circle cx="4" cy="12" r="1.5" fill={color} />
    <Circle cx="4" cy="18" r="1.5" fill={color} />
  </Svg>
);

export const MessageIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />
  </Svg>
);

export const PersonIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </Svg>
);

export const PlusIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

export const ChevronLeftIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M15 18l-6-6 6-6" />
  </Svg>
);

export const ChevronRightIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

export const CheckIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 2 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M5 13l4 4L19 7" />
  </Svg>
);

export const MapPinIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z" />
    <Circle cx="12" cy="9" r="3" />
  </Svg>
);

export const StarIcon = ({
  size = 24,
  color = colors.aubergine,
  strokeWidth = 1.75,
  filled = false,
}: IconProps & { filled?: boolean }) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path
      d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z"
      fill={filled ? color : 'none'}
    />
  </Svg>
);

export const CameraIcon = ({ size = 24, color = colors.aubergine, strokeWidth = 1.75 }: IconProps) => (
  <Svg {...baseProps(size, color, strokeWidth)}>
    <Path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);
