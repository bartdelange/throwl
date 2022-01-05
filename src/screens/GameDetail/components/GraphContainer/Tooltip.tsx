import deepmerge from 'deepmerge';
import * as React from 'react';
import {
  ChartDataPoint,
  Label,
  XYValue,
  Shape,
  FontWeight,
} from 'react-native-responsive-linechart';
import { Text, Rect } from 'react-native-svg';
import ChartContext from 'react-native-responsive-linechart/lib/ChartContext';

type Props = {
  theme?: {
    label?: Label;
    shape?: Shape;
    formatter?: (value: ChartDataPoint) => { label: string; data: string };
  };
  value?: ChartDataPoint;
  position?: XYValue;
};

const Tooltip: React.FC<Props> = props => {
  const { dimensions } = React.useContext(ChartContext);

  const {
    theme: { label, formatter, shape },
    value,
    position,
  } = deepmerge(defaultProps, props);

  if (!dimensions || !value || !position) {
    return null;
  }

  return (
    <React.Fragment>
      <Rect
        x={position.x - shape.width / 2 + shape.dx}
        y={position.y - shape.height / 2 - shape.dy}
        rx={shape.rx}
        fill={shape.color}
        opacity={shape.opacity}
        height={shape.height}
        width={shape.width}
      />
      <Text
        x={position.x + label.dx}
        y={position.y - label.dy - shape.height / 5}
        fontSize={label.fontSize}
        fontWeight={label.fontWeight}
        fontFamily={label.fontFamily}
        fill={label.color}
        opacity={label.opacity}
        textAnchor={label.textAnchor}>
        {formatter(value).label}
      </Text>
      {formatter(value)
        .data.split(' - ')
        .map((val, index) => (
          <Text
            x={position.x + label.dx}
            y={
              position.y -
              label.dy +
              shape.height / 10 +
              (shape.height / 5) * index
            }
            fontSize={label.fontSize}
            fontWeight={label.fontWeight}
            fontFamily={label.fontFamily}
            fill={label.color}
            opacity={label.opacity}
            textAnchor={label.textAnchor}>
            {val}
          </Text>
        ))}
    </React.Fragment>
  );
};

export { Tooltip };
const defaultProps = {
  theme: {
    label: {
      color: 'white',
      fontSize: 12,
      fontWeight: 700,
      textAnchor: 'middle',
      opacity: 1,
      dx: 0,
      dy: 16.5,
    },
    shape: {
      width: 35,
      height: 20,
      dx: 0,
      dy: 20,
      rx: 4,
      color: 'black',
    },
    formatter: (v: ChartDataPoint) => ({
      label: String(v.y),
      data: '',
    }),
  },
};
