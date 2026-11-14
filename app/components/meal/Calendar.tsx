import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAppTheme } from "@/lib/theme";
import { Moment } from "moment";

interface CalendarProps {
  dates: Moment[];
  selectedDate: string;
  onSelectDate: (date: Moment) => void;
  weekLabel1: string;
  weekLabel2: string;
  addButtonLabel: string;
}

export default function Calendar({
  dates,
  selectedDate,
  onSelectDate,
  weekLabel1,
  weekLabel2,
  addButtonLabel,
}: CalendarProps) {
  const { colors } = useAppTheme();

  const renderWeek = (weekDates: Moment[]) => (
    <View style={styles.weekRow}>
      {weekDates.map((date) => {
        const isSelected = selectedDate === date.format("YYYY-MM-DD");
        return (
          <TouchableOpacity
            key={date.format("YYYY-MM-DD")}
            onPress={() => onSelectDate(date)}
            style={[
              styles.dayContainer,
              isSelected && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={[styles.dayText, { color: colors.mutedForeground }]}>
              {date.format("dd").charAt(0)}
            </Text>
            <Text
              style={[
                styles.dateText,
                {
                  color: isSelected
                    ? colors.primaryForeground
                    : colors.foreground,
                },
              ]}
            >
              {date.format("D")}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.calendarSection}>
      <Text style={[styles.weekLabel, { color: colors.foreground }]}>
        {weekLabel1}
      </Text>
      {renderWeek(dates.slice(0, 7))}

      <Text style={[styles.weekLabel, { color: colors.foreground }]}>
        {weekLabel2}
      </Text>
      {renderWeek(dates.slice(7, 14))}

      <TouchableOpacity style={styles.addButton}>
        <Text style={[styles.addButtonText, { color: colors.primary }]}>
          + {addButtonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarSection: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  weekLabel: {
    fontSize: 16,
    marginBottom: 10,
    marginTop: 20,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayContainer: {
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    width: 40,
  },
  dayText: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  addButton: {
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    marginTop: -20,
    fontWeight: "500",
  },
});
