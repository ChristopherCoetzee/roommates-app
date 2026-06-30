import {
  PREDEFINED_CHORES,
  Task,
  TaskCategory,
  TaskStatus,
  useTasks,
} from "@/store/tasks";
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DateTimePicker,
  DateTimePickerIcon,
  DateTimePickerInput,
  DateTimePickerTrigger,
} from "@/components/ui/date-time-picker";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from "@gluestack-ui/themed";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  primary: "#2563EB",
  pending: "#F59E0B",
  in_progress: "#3B82F6",
  completed: "#10B981",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray700: "#374151",
  gray900: "#111827",
  white: "#FFFFFF",
  amber50: "#FFFBEB",
  amber600: "#D97706",
};

type FilterStatus = "all" | TaskStatus;

const CATEGORY_ICONS: Record<TaskCategory, keyof typeof Ionicons.glyphMap> = {
  cleaning: "sparkles-outline",
  kitchen: "restaurant-outline",
  outdoor: "leaf-outline",
  laundry: "shirt-outline",
  shopping: "cart-outline",
  other: "ellipsis-horizontal-circle-outline",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Done",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: C.pending,
  in_progress: C.in_progress,
  completed: C.completed,
};

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  cleaning: "Cleaning",
  kitchen: "Kitchen",
  outdoor: "Outdoor",
  laundry: "Laundry",
  shopping: "Shopping",
  other: "Other",
};

const CATEGORIES: TaskCategory[] = [
  "cleaning",
  "kitchen",
  "outdoor",
  "laundry",
  "shopping",
  "other",
];

const ROOMMATES = ["Alex", "Sam", "Jordan"];

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Done" },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function TasksScreen() {
  const { tasks, dispatch } = useTasks();

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"templates" | "custom">("templates");

  const [customTitle, setCustomTitle] = useState("");
  const [customPoints, setCustomPoints] = useState("10");
  const [customCategory, setCustomCategory] = useState<TaskCategory>("other");
  const [customAssignee, setCustomAssignee] = useState("");
  const [customDueDate, setCustomDueDate] = useState("");
  const [templateAssignee, setTemplateAssignee] = useState("");
  const [templateDueDate, setTemplateDueDate] = useState("");
  const [pendingTemplates, setPendingTemplates] = useState<Record<string, number>>({});

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  const totalPoints = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.points, 0),
    [tasks],
  );

  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.title] = (counts[t.title] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  const filterCounts: Record<FilterStatus, number> = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const groupedChores = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        category: cat,
        chores: PREDEFINED_CHORES.filter((c) => c.category === cat),
      })).filter((g) => g.chores.length > 0),
    [],
  );

  function openModal() {
    setModalTab("templates");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setCustomTitle("");
    setCustomPoints("10");
    setCustomCategory("other");
    setCustomAssignee("");
    setCustomDueDate("");
    setTemplateAssignee("");
    setTemplateDueDate("");
    setPendingTemplates({});
  }

  const pendingTotal = Object.values(pendingTemplates).reduce((s, v) => s + v, 0);

  function incrementPending(title: string) {
    setPendingTemplates((prev) => ({ ...prev, [title]: (prev[title] ?? 0) + 1 }));
  }

  function decrementPending(title: string) {
    setPendingTemplates((prev) => {
      const next = { ...prev };
      if ((next[title] ?? 0) <= 1) delete next[title];
      else next[title]--;
      return next;
    });
  }

  function addPendingTasks() {
    PREDEFINED_CHORES.forEach((chore) => {
      const count = pendingTemplates[chore.title] ?? 0;
      for (let i = 0; i < count; i++) {
        dispatch({
          type: "ADD_TASK",
          task: {
            id: makeId(),
            title: chore.title,
            points: chore.points,
            category: chore.category,
            status: "pending",
            assignee: templateAssignee.trim(),
            isCustom: false,
            createdAt: new Date().toISOString(),
            dueDate: templateDueDate || undefined,
          },
        });
      }
    });
    closeModal();
  }

  function addCustomTask() {
    const title = customTitle.trim();
    if (!title) return;
    const pts = parseInt(customPoints, 10);
    dispatch({
      type: "ADD_TASK",
      task: {
        id: makeId(),
        title,
        points: isNaN(pts) || pts < 1 ? 10 : Math.min(pts, 999),
        category: customCategory,
        status: "pending",
        assignee: customAssignee.trim(),
        isCustom: true,
        createdAt: new Date().toISOString(),
        dueDate: customDueDate || undefined,
      },
    });
    closeModal();
  }

  function promptStatusChange(task: Task) {
    const options = (
      [
        task.status !== "pending" && {
          text: "Mark Pending",
          onPress: () =>
            dispatch({ type: "UPDATE_STATUS", id: task.id, status: "pending" }),
        },
        task.status !== "in_progress" && {
          text: "Mark In Progress",
          onPress: () =>
            dispatch({
              type: "UPDATE_STATUS",
              id: task.id,
              status: "in_progress",
            }),
        },
        task.status !== "completed" && {
          text: "Mark Done",
          onPress: () =>
            dispatch({
              type: "UPDATE_STATUS",
              id: task.id,
              status: "completed",
            }),
        },
        {
          text: "Delete",
          style: "destructive" as const,
          onPress: () => dispatch({ type: "DELETE_TASK", id: task.id }),
        },
        { text: "Cancel", style: "cancel" as const },
      ] as const
    ).filter(Boolean);
    Alert.alert(
      task.title,
      `${task.points} pts · ${STATUS_LABELS[task.status]}`,
      options as any,
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
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
            <Text
              style={[s.filterTabText, filter === key && s.filterTabTextActive]}
            >
              {label}{" "}
              <Text
                style={filter === key ? s.filterCountActive : s.filterCount}
              >
                ({filterCounts[key]})
              </Text>
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[s.list, filtered.length === 0 && s.listEmpty]}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="checkbox-outline" size={52} color={C.gray200} />
            <Text style={s.emptyTitle}>No tasks here</Text>
            <Text style={s.emptySubtitle}>Tap + to add a chore</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard task={item} onPress={promptStatusChange} />
        )}
      />

      <TouchableOpacity style={s.fab} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color={C.white} />
      </TouchableOpacity>

      <Modal isOpen={showModal} onClose={closeModal} size="full">
        <ModalBackdrop />
        <ModalContent style={s.gsModalContent}>
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
            <ModalHeader style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Task</Text>
              <ModalCloseButton onPress={closeModal} style={s.modalCloseBtn}>
                <Ionicons name="close" size={22} color={C.gray700} />
              </ModalCloseButton>
            </ModalHeader>

            <View style={s.modalTabs}>
              {(["templates", "custom"] as const).map((tab) => (
                <Pressable
                  key={tab}
                  style={[s.modalTab, modalTab === tab && s.modalTabActive]}
                  onPress={() => setModalTab(tab)}
                >
                  <Text
                    style={[
                      s.modalTabText,
                      modalTab === tab && s.modalTabTextActive,
                    ]}
                  >
                    {tab === "templates" ? "From templates" : "Custom task"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {modalTab === "templates" ? (
              <>
              <ModalBody
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.modalBodyContent}
                style={s.modalScroll}
              >
                <Text style={s.inputLabel}>Assign to (optional)</Text>
                <Select
                  selectedValue={templateAssignee}
                  onValueChange={(val) =>
                    setTemplateAssignee(val === "__none__" ? "" : val)
                  }
                >
                  <SelectTrigger variant="outline" size="md" style={s.selectTrigger}>
                    <SelectInput
                      placeholder="Select roommate"
                      style={s.selectInput}
                    />
                    <SelectIcon style={s.selectIconWrapper}>
                      <Ionicons name="chevron-down" size={16} color={C.gray500} />
                    </SelectIcon>
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent style={{ minHeight: SCREEN_HEIGHT * 0.55 }}>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      <SelectItem label="None" value="__none__" />
                      {ROOMMATES.map((name) => (
                        <SelectItem key={name} label={name} value={name} />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
                <Text style={s.inputLabel}>Due date (optional)</Text>
                <View style={s.datePickerRow}>
                  <View style={{ flex: 1 }}>
                    <DateTimePicker
                      value={templateDueDate ? new Date(templateDueDate + "T00:00:00") : undefined}
                      onChange={(date) =>
                        setTemplateDueDate(date.toISOString().slice(0, 10))
                      }
                      mode="date"
                    >
                      <DateTimePickerTrigger>
                        <DateTimePickerInput placeholder="Select due date" />
                        <DateTimePickerIcon>
                          <Ionicons name="calendar-outline" size={18} color={C.gray400} />
                        </DateTimePickerIcon>
                      </DateTimePickerTrigger>
                    </DateTimePicker>
                  </View>
                  {templateDueDate ? (
                    <TouchableOpacity
                      onPress={() => setTemplateDueDate("")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={C.gray400} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={[s.inputLabel, { marginTop: 20 }]}>
                  Select chores, then tap Add Tasks
                </Text>
                {groupedChores.map(({ category, chores }) => (
                  <View key={category}>
                    <View style={s.categoryHeader}>
                      <Ionicons
                        name={CATEGORY_ICONS[category]}
                        size={13}
                        color={C.gray500}
                      />
                      <Text style={s.categoryHeaderText}>
                        {CATEGORY_LABELS[category]}
                      </Text>
                    </View>
                    {chores.map((chore) => {
                      const pendingCount = pendingTemplates[chore.title] ?? 0;
                      const existingCount = templateCounts[chore.title] ?? 0;
                      return (
                        <View key={chore.title} style={s.choreItem}>
                          <View style={{ flex: 1 }}>
                            <Text style={s.choreTitle}>{chore.title}</Text>
                            {existingCount > 0 && (
                              <Text style={s.choreExisting}>
                                ×{existingCount} already added
                              </Text>
                            )}
                          </View>
                          <View style={s.choreRight}>
                            <View style={s.chorePts}>
                              <Ionicons name="star" size={11} color="#FBBF24" />
                              <Text style={s.chorePtsText}>{chore.points}</Text>
                            </View>
                            {pendingCount > 0 ? (
                              <View style={s.choreCounter}>
                                <TouchableOpacity
                                  onPress={() => decrementPending(chore.title)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  activeOpacity={0.65}
                                >
                                  <Ionicons name="remove" size={16} color={C.primary} />
                                </TouchableOpacity>
                                <Text style={s.choreCounterText}>{pendingCount}</Text>
                                <TouchableOpacity
                                  onPress={() => incrementPending(chore.title)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  activeOpacity={0.65}
                                >
                                  <Ionicons name="add" size={16} color={C.primary} />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={s.choreAddBtn}
                                onPress={() => incrementPending(chore.title)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                activeOpacity={0.65}
                              >
                                <Ionicons name="add" size={18} color={C.white} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
                <View style={{ height: 24 }} />
              </ModalBody>
              {pendingTotal > 0 && (
                <View style={s.templateFooter}>
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={addPendingTasks}
                    activeOpacity={0.8}
                  >
                    <Text style={s.addBtnText}>
                      Add {pendingTotal} Task{pendingTotal !== 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              </>
            ) : (
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
              >
                <ModalBody
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={s.modalBodyContent}
                  style={s.modalScroll}
                >
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
                    {CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat}
                        style={[
                          s.categoryPill,
                          customCategory === cat && s.categoryPillActive,
                        ]}
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
                  <Select
                    selectedValue={customAssignee}
                    onValueChange={(val) =>
                      setCustomAssignee(val === "__none__" ? "" : val)
                    }
                  >
                    <SelectTrigger variant="outline" size="md" style={s.selectTrigger}>
                      <SelectInput
                        placeholder="Select roommate"
                        style={s.selectInput}
                      />
                      <SelectIcon style={s.selectIconWrapper}>
                        <Ionicons name="chevron-down" size={16} color={C.gray500} />
                      </SelectIcon>
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent style={{ minHeight: SCREEN_HEIGHT * 0.55 }}>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        <SelectItem label="None" value="__none__" />
                        {ROOMMATES.map((name) => (
                          <SelectItem key={name} label={name} value={name} />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>

                  <Text style={s.inputLabel}>Due date (optional)</Text>
                  <View style={s.datePickerRow}>
                    <View style={{ flex: 1 }}>
                      <DateTimePicker
                        value={customDueDate ? new Date(customDueDate + "T00:00:00") : undefined}
                        onChange={(date) =>
                          setCustomDueDate(date.toISOString().slice(0, 10))
                        }
                        mode="date"
                      >
                        <DateTimePickerTrigger>
                          <DateTimePickerInput placeholder="Select due date" />
                          <DateTimePickerIcon>
                            <Ionicons name="calendar-outline" size={18} color={C.gray400} />
                          </DateTimePickerIcon>
                        </DateTimePickerTrigger>
                      </DateTimePicker>
                    </View>
                    {customDueDate ? (
                      <TouchableOpacity
                        onPress={() => setCustomDueDate("")}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="close-circle" size={20} color={C.gray400} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={[s.addBtn, !customTitle.trim() && s.addBtnDisabled]}
                    onPress={addCustomTask}
                    disabled={!customTitle.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={s.addBtnText}>Add Task</Text>
                  </TouchableOpacity>
                  <View style={{ height: 40 }} />
                </ModalBody>
              </KeyboardAvoidingView>
            )}
          </SafeAreaView>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
}

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDueDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const mi = parseInt(m, 10) - 1;
  const monthName = MONTH_ABBR[mi] ?? m;
  return `${parseInt(d, 10)} ${monthName} ${y}`;
}

function isOverdue(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso + "T00:00:00");
  return due < today;
}

function TaskCard({
  task,
  onPress,
}: {
  task: Task;
  onPress: (t: Task) => void;
}) {
  const accentColor = STATUS_COLORS[task.status];
  return (
    <Pressable style={s.card} onPress={() => onPress(task)}>
      <View style={[s.cardAccent, { backgroundColor: accentColor }]} />
      <View style={s.cardBody}>
        <View style={s.cardRow}>
          <View style={s.cardIcon}>
            <Ionicons
              name={CATEGORY_ICONS[task.category]}
              size={18}
              color={C.gray500}
            />
          </View>
          <View style={s.cardInfo}>
            <Text
              style={[
                s.cardTitle,
                task.status === "completed" && s.cardTitleDone,
              ]}
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
            {task.dueDate ? (
              <View style={s.assigneeRow}>
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={
                    task.status !== "completed" && isOverdue(task.dueDate)
                      ? "#EF4444"
                      : C.gray400
                  }
                />
                <Text
                  style={[
                    s.assigneeText,
                    task.status !== "completed" &&
                      isOverdue(task.dueDate) &&
                      s.dueDateOverdue,
                  ]}
                >
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={s.cardMeta}>
            <View style={s.ptsPill}>
              <Ionicons name="star" size={11} color="#FBBF24" />
              <Text style={s.ptsPillText}>{task.points}</Text>
            </View>
            <View
              style={[s.statusChip, { backgroundColor: accentColor + "22" }]}
            >
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.gray900,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, color: C.gray400, marginTop: 2 },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.amber50,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  pointsText: { fontSize: 13, fontWeight: "600", color: C.amber600 },

  filterScroll: { maxHeight: 52 },
  filterContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    alignItems: "center",
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.gray100,
  },
  filterTabActive: { backgroundColor: C.primary },
  filterTabText: { fontSize: 13, fontWeight: "500", color: C.gray500 },
  filterTabTextActive: { color: C.white, fontWeight: "600" },
  filterCount: { fontWeight: "400", color: C.gray400 },
  filterCountActive: { fontWeight: "400", color: "rgba(255,255,255,0.75)" },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 10 },
  listEmpty: { flexGrow: 1 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: C.gray700 },
  emptySubtitle: { fontSize: 14, color: C.gray400 },

  card: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.gray200,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: "500", color: C.gray900 },
  cardTitleDone: { textDecorationLine: "line-through", color: C.gray400 },
  assigneeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  assigneeText: { fontSize: 12, color: C.gray400 },
  cardMeta: { alignItems: "flex-end", gap: 6 },
  ptsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.amber50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  ptsPillText: { fontSize: 12, fontWeight: "600", color: C.amber600 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusChipText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.1 },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },

  gsModalContent: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 0,
    margin: 0,
    maxHeight: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: C.gray900 },
  modalCloseBtn: { padding: 4 },
  modalTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.gray200,
  },
  modalTab: { paddingVertical: 14, paddingHorizontal: 6, marginRight: 20 },
  modalTabActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  modalTabText: { fontSize: 14, fontWeight: "500", color: C.gray400 },
  modalTabTextActive: { color: C.primary, fontWeight: "600" },
  modalScroll: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  modalBodyContent: { paddingHorizontal: 0 },

  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
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
  selectTrigger: {
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 0,
    backgroundColor: C.gray100,
    height: 48,
  },
  selectInput: {
    flex: 1,
    fontSize: 15,
    color: C.gray900,
  },
  selectIconWrapper: {
    marginRight: 2,
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    marginBottom: 4,
  },
  categoryHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  choreItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  choreTitle: { fontSize: 15, color: C.gray900, flex: 1 },
  choreRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  chorePts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.amber50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chorePtsText: { fontSize: 12, fontWeight: "600", color: C.amber600 },
  choreCount: {
    backgroundColor: C.primary + "18",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  choreCountText: { fontSize: 11, fontWeight: "700", color: C.primary },

  categoryRow: { paddingVertical: 4, gap: 8 },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.gray100,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryPillActive: { backgroundColor: C.primary, borderColor: C.primary },
  categoryPillText: { fontSize: 13, color: C.gray500, fontWeight: "500" },
  categoryPillTextActive: { color: C.white },

  addBtn: {
    marginTop: 28,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  addBtnDisabled: { opacity: 0.45 },
  addBtnText: { color: C.white, fontSize: 16, fontWeight: "600" },

  choreAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  choreCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.primary + "14",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginLeft: 4,
  },
  choreCounterText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primary,
    minWidth: 16,
    textAlign: "center",
  },
  choreExisting: {
    fontSize: 11,
    color: C.gray400,
    marginTop: 2,
  },
  templateFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    backgroundColor: C.white,
  },

  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dueDateOverdue: { color: "#EF4444" },
});
