import RNDateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Mode = 'date' | 'time' | 'datetime';

type ContextType = {
  value?: Date;
  onChange?: (date: Date) => void;
  mode: Mode;
  minimumDate?: Date;
  maximumDate?: Date;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const Ctx = createContext<ContextType>({
  mode: 'date',
  open: false,
  setOpen: () => {},
});

// ─── DateTimePicker ───────────────────────────────────────────────────────────

type DateTimePickerProps = {
  value?: Date;
  onChange?: (date: Date) => void;
  mode?: Mode;
  minimumDate?: Date;
  maximumDate?: Date;
  children: ReactNode;
};

export function DateTimePicker({
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  children,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const pickerValue = value ?? new Date();

  function handleChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (_event.type === 'set' && date) onChange?.(date);
    } else {
      if (date) onChange?.(date);
    }
  }

  return (
    <Ctx.Provider value={{ value, onChange, mode, minimumDate, maximumDate, open, setOpen }}>
      {children}

      {/* Android: native dialog */}
      {open && Platform.OS === 'android' && (
        <RNDateTimePicker
          value={pickerValue}
          mode={mode}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS: bottom sheet with spinner */}
      {open && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible statusBarTranslucent>
          <Pressable style={s.overlay} onPress={() => setOpen(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={s.doneBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <RNDateTimePicker
              value={pickerValue}
              mode={mode}
              display="spinner"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              style={s.iosPicker}
            />
          </View>
        </Modal>
      )}
    </Ctx.Provider>
  );
}

// ─── DateTimePickerTrigger ────────────────────────────────────────────────────

type TriggerProps = {
  children: ReactNode;
  style?: object;
};

export function DateTimePickerTrigger({ children, style }: TriggerProps) {
  const { setOpen } = useContext(Ctx);
  return (
    <Pressable
      onPress={() => setOpen(true)}
      style={({ pressed }) => [s.trigger, pressed && s.triggerPressed, style]}
    >
      {children}
    </Pressable>
  );
}

// ─── DateTimePickerInput ──────────────────────────────────────────────────────

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function defaultFormat(date: Date, mode: Mode): string {
  if (mode === 'time') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const d = date.getDate();
  const m = MONTH_ABBR[date.getMonth()];
  const y = date.getFullYear();
  if (mode === 'datetime') {
    const t = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d} ${m} ${y}, ${t}`;
  }
  return `${d} ${m} ${y}`;
}

type InputProps = {
  placeholder?: string;
  format?: (date: Date, mode: Mode) => string;
  style?: object;
};

export function DateTimePickerInput({
  placeholder = 'Select date',
  format = defaultFormat,
  style,
}: InputProps) {
  const { value, mode } = useContext(Ctx);
  return (
    <Text style={[s.inputText, !value && s.placeholder, style]} numberOfLines={1}>
      {value ? format(value, mode) : placeholder}
    </Text>
  );
}

// ─── DateTimePickerIcon ───────────────────────────────────────────────────────

type IconProps = {
  children?: ReactNode;
  as?: React.ComponentType<any>;
  style?: object;
  [key: string]: any;
};

export function DateTimePickerIcon({ children, as: Icon, style, ...rest }: IconProps) {
  if (Icon) return <Icon style={style} {...rest} />;
  return <View style={style}>{children}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#F3F4F6',
  },
  triggerPressed: { opacity: 0.75 },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  placeholder: { color: '#9CA3AF' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  doneBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  iosPicker: { height: 200 },
});
