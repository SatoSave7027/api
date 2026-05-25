import { Pressable, StyleSheet, Text, View } from "react-native";

interface SectionCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function SectionCard({ title, subtitle, onPress }: SectionCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34, 230, 214, 0.4)",
    backgroundColor: "rgba(16, 25, 23, 0.85)",
    padding: 14
  },
  cardPressed: {
    transform: [{ scale: 0.98 }]
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#89ff2c"
  },
  subtitle: {
    marginTop: 4,
    color: "#a6d5d0"
  }
});
