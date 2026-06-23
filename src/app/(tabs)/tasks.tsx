import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  useTasks,
  PREDEFINED_CHORES,
  Task,
  TaskStatus,
  TaskCategory,
} from '@/store/tasks';

const C = {
  primary: '#2563EB',
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  completed: '#10B981',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#111827',
  white: '#FFFFFF',
  amber50: '#FFFBEB',
  amber600: '#D97706',
};

type FilterStatus = 'all' | TaskStatus;

const CATEGORY_ICONS: Record<TaskCategory, keyof typeof Ionicons.glyphMap> = {
  cleaning: 'sparkles-outline',
  kitchen: 'restaurant-outline',
  outdoor: 'leaf-outline',
  laundry: 'shirt-outline',
  shopping: 'cart-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Done',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: C.pending,
  in_progress: C.in_progress,
  completed: C.completed,
};

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  cleaning: 'Cleaning',
  kitchen: 'Kitchen',
  outdoor: 'Outdoor',
  laundry: 'Laundry',
  shopping: 'Shopping',
  other: 'Other',
};

const CATEGORIES: TaskCategory[] = ['cleaning', 'kitchen', 'outdoor', 'laundry', 'shopping', 'other'];

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Done' },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function TasksScreen() {
  const { tasks, dispatch } = useTasks();

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'templates' | 'custom'>('templates');

  const [customTitle, setCustomTitle] = useState('');
  const [customPoints, setCustomPoints] = useState('10');
  const [customCategory, setCustomCategory] = useState<TaskCategory>('other');
  const [customAssignee, setCustomAssignee] = useState('');
  const [templateAssignee, setTemplateAssignee] = useState('');

  const filtered = useMemo(
    () => (filter === 'all' ? tasks : tasks.filter(t => t.status === filter)),
    [tasks, filter]
  );

  const totalPoints = useMemo(
    () => tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.points, 0),
    [tasks]
  );

  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      counts[t.title] = (counts[t.title] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  const filterCounts: Record<FilterStatus, number> = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    }),
    [tasks]
  );

  const groupedChores = useMemo(
    () =>
      CATEGORIES.map(cat => ({
        category: cat,
        chores: PREDEFINED_CHORES.filter(c => c.category === cat),
      })).filter(g => g.chores.length > 0),
    []
  );

  function openModal() {
    setModalTab('templates');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setCustomTitle('');
    setCustomPoints('10');
    setCustomCategory('other');
    setCustomAssignee('');
    setTemplateAssignee('');
  }

  function addFromTemplate(chore: (typeof PREDEFINED_CHORES)[number]) {
    dispatch({
      type: 'ADD_TASK',
      task: {
        id: makeId(),
        title: chore.title,
        points: chore.points,
        category: chore.category,
        status: 'pending',
        assignee: templateAssignee.trim(),
        isCustom: false,
        createdAt: new Date().toISOString(),
      },
    });
  }

  function addCustomTask() {
    const title = customTitle.trim();
    if (!title) return;
    const pts = parseInt(customPoints, 10);
    dispatch({
      type: 'ADD_TASK',
      task: {
        id: makeId(),
        title,
        points: isNaN(pts) || pts < 1 ? 10 : Math.min(pts, 999),
        category: customCategory,
        status: 'pending',
        assignee: customAssignee.trim(),
        isCustom: true,
        createdAt: new Date().toISOString(),
      },
    });
    closeModal();
  }

  function promptStatusChange(task: Task) {
    const options = (
      [
        task.status !== 'pending' && {
          text: 'Mark Pending',
          onPress: () => dispatch({ type: 'UPDATE_STATUS', id: task.id, status: 'pending' }),
        },
        task.status !== 'in_progress' && {
          text: 'Mark In Progress',
          onPress: () => dispatch({ type: 'UPDATE_STATUS', id: task.id, status: 'in_progress' }),
        },
        task.status !== 'completed' && {
          text: 'Mark Done',
          onPress: () => dispatch({ type: 'UPDATE_STATUS', id: task.id, status: 'completed' }),
        },
        { text: 'Delete', style: 'destructive' as const, onPress: () => dispatch({ type: 'DELETE_TASK', id: task.id }) },
        { text: 'Cancel', style: 'cancel' as const },
      ] as const
    ).filter(Boolean);
    Alert.alert(task.title, `${task.points} pts · ${STATUS_LABELS[task.status]}`, options as any);
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Tasks</Text>
          <Text style={s.headerSub}>Manage shared chores</Text>
        </View>
        <View style={s.pointsBadge}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={s.pointsText}>{totalPoints} pts earned</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterContent}
      >
        {FILTERS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[s.filterTab, filter === key && s.filterTabActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.filterTabText, filter === key && s.filterTabTextActive]}>
              {label}{' '}
              <Text style={filter === key ? s.filterCountActive : s.filterCount}>
                ({filterCounts[key]})
              </Text>
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        contentContainerStyle={[s.list, filtered.length === 0 && s.listEmpty]}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="checkbox-outline" size={52} color={C.gray200} />
            <Text style={s.emptyTitle}>No tasks here</Text>
            <Text style={s.emptySubtitle}>Tap + to add a chore</Text>
          </View>
        }
        renderItem={({ item }) => <TaskCard task={item} onPress={promptStatusChange} />}
      />

      <TouchableOpacity style={s.fab} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color={C.white} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={s.modalContainer} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Task</Text>
            <TouchableOpacity onPress={closeModal} style={s.modalCloseBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={C.gray700} />
            </TouchableOpacity>
          </View>

          <View style={s.modalTabs}>
            {(['templates', 'custom'] as const).map(tab => (
              <Pressable
                key={tab}
                style={[s.modalTab, modalTab === tab && s.modalTabActive]}
                onPress={() => setModalTab(tab)}
              >
                <Text style={[s.modalTabText, modalTab === tab && s.modalTabTextActive]}>
                  {tab === 'templates' ? 'From templates' : 'Custom task'}
                </Text>
              </Pressable>
            ))}
          </View>

          {modalTab === 'templates' ? (
            <ScrollView style={s.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={s.inputLabel}>Assign to (optional)</Text>
              <TextInput
                style={s.textInput}
                placeholder="Roommate name"
                value={templateAssignee}
                onChangeText={setTemplateAssignee}
                placeholderTextColor={C.gray400}
                returnKeyType="done"
              />
              <Text style={[s.inputLabel, { marginTop: 20 }]}>
                Tap a chore to add it to your list
              </Text>
              {groupedChores.map(({ category, chores }) => (
                <View key={category}>
                  <View style={s.categoryHeader}>
                    <Ionicons name={CATEGORY_ICONS[category]} size={13} color={C.gray500} />
                    <Text style={s.categoryHeaderText}>{CATEGORY_LABELS[category]}</Text>
                  </View>
                  {chores.map(chore => (
                    <TouchableOpacity
                      key={chore.title}
                      style={s.choreItem}
                      onPress={() => addFromTemplate(chore)}
                      activeOpacity={0.6}
                    >
                      <Text style={s.choreTitle}>{chore.title}</Text>
                      <View style={s.choreRight}>
                        <View style={s.chorePts}>
                          <Ionicons name="star" size={11} color="#FBBF24" />
                          <Text style={s.chorePtsText}>{chore.points}</Text>
                        </View>
                        {(templateCounts[chore.title] ?? 0) > 0 && (
                          <View style={s.choreCount}>
                            <Text style={s.choreCountText}>×{templateCounts[chore.title]}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView style={s.modalScroll} keyboardShouldPersistTaps="handled">
                <Text style={s.inputLabel}>Task name *</Text>
                <TextInput
                  style={s.textInput}
                  placeholder="e.g. Clean the garage"
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholderTextColor={C.gray400}
                  returnKeyType="next"
                  autoFocus
                />

                <Text style={s.inputLabel}>Points</Text>
                <TextInput
                  style={s.textInput}
                  keyboardType="number-pad"
                  placeholder="10"
                  value={customPoints}
                  onChangeText={setCustomPoints}
                  placeholderTextColor={C.gray400}
                  returnKeyType="done"
                />

                <Text style={s.inputLabel}>Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.categoryRow}
                >
                  {CATEGORIES.map(cat => (
                    <Pressable
                      key={cat}
                      style={[s.categoryPill, customCategory === cat && s.categoryPillActive]}
                      onPress={() => setCustomCategory(cat)}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[cat]}
                        size={13}
                        color={customCategory === cat ? C.white : C.gray500}
                      />
                      <Text
                        style={[
                          s.categoryPillText,
                          customCategory === cat && s.categoryPillTextActive,
                        ]}
                      >
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={s.inputLabel}>Assign to (optional)</Text>
                <TextInput
                  style={s.textInput}
                  placeholder="Roommate name"
                  value={customAssignee}
                  onChangeText={setCustomAssignee}
                  placeholderTextColor={C.gray400}
                  returnKeyType="done"
                />

                <TouchableOpacity
                  style={[s.addBtn, !customTitle.trim() && s.addBtnDisabled]}
                  onPress={addCustomTask}
                  disabled={!customTitle.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={s.addBtnText}>Add Task</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function TaskCard({ task, onPress }: { task: Task; onPress: (t: Task) => void }) {
  const accentColor = STATUS_COLORS[task.status];
  return (
    <Pressable style={s.card} onPress={() => onPress(task)}>
      <View style={[s.cardAccent, { backgroundColor: accentColor }]} />
      <View style={s.cardBody}>
        <View style={s.cardRow}>
          <View style={s.cardIcon}>
            <Ionicons name={CATEGORY_ICONS[task.category]} size={18} color={C.gray500} />
          </View>
          <View style={s.cardInfo}>
            <Text
              style={[s.cardTitle, task.status === 'completed' && s.cardTitleDone]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {task.assignee ? (
              <View style={s.assigneeRow}>
                <Ionicons name="person-outline" size={11} color={C.gray400} />
                <Text style={s.assigneeText}>{task.assignee}</Text>
              </View>
            ) : null}
          </View>
          <View style={s.cardMeta}>
            <View style={s.ptsPill}>
              <Ionicons name="star" size={11} color="#FBBF24" />
              <Text style={s.ptsPillText}>{task.points}</Text>
            </View>
            <View style={[s.statusChip, { backgroundColor: accentColor + '22' }]}>
              <Text style={[s.statusChipText, { color: accentColor }]}>
                {STATUS_LABELS[task.status]}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: C.gray900, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.gray400, marginTop: 2 },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.amber50,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsText: { fontSize: 13, fontWeight: '600', color: C.amber600 },

  filterScroll: { maxHeight: 52 },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.gray100,
  },
  filterTabActive: { backgroundColor: C.primary },
  filterTabText: { fontSize: 13, fontWeight: '500', color: C.gray500 },
  filterTabTextActive: { color: C.white, fontWeight: '600' },
  filterCount: { fontWeight: '400', color: C.gray400 },
  filterCountActive: { fontWeight: '400', color: 'rgba(255,255,255,0.75)' },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 10 },
  listEmpty: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: C.gray700 },
  emptySubtitle: { fontSize: 14, color: C.gray400 },

  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gray200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '500', color: C.gray900 },
  cardTitleDone: { textDecorationLine: 'line-through', color: C.gray400 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  assigneeText: { fontSize: 12, color: C.gray400 },
  cardMeta: { alignItems: 'flex-end', gap: 6 },
  ptsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.amber50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ptsPillText: { fontSize: 12, fontWeight: '600', color: C.amber600 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusChipText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },

  modalContainer: { flex: 1, backgroundColor: C.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.gray900 },
  modalCloseBtn: { padding: 4 },
  modalTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  modalTab: { paddingVertical: 14, paddingHorizontal: 6, marginRight: 20 },
  modalTabActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  modalTabText: { fontSize: 14, fontWeight: '500', color: C.gray400 },
  modalTabTextActive: { color: C.primary, fontWeight: '600' },
  modalScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.gray700,
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.gray900,
    backgroundColor: C.gray100,
  },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 4,
  },
  categoryHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  choreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  choreTitle: { fontSize: 15, color: C.gray900, flex: 1 },
  choreRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chorePts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.amber50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chorePtsText: { fontSize: 12, fontWeight: '600', color: C.amber600 },
  choreCount: {
    backgroundColor: C.primary + '18',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  choreCountText: { fontSize: 11, fontWeight: '700', color: C.primary },

  categoryRow: { paddingVertical: 4, gap: 8 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.gray100,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  categoryPillText: { fontSize: 13, color: C.gray500, fontWeight: '500' },
  categoryPillTextActive: { color: C.white },

  addBtn: {
    marginTop: 28,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.45 },
  addBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
});
