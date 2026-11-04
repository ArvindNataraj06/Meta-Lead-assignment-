
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from "react-native";
import { io } from "socket.io-client";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

const SERVER_URL = "https://guidance-glowing-sixties.ngrok-free.dev";

export default function HomeScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL);

    socket.on("connect", () => {
      setConnected(true);
      console.log("Connected to backend");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("leads:init", (data: Lead[]) => {
      setLeads(data);
    });

    socket.on("lead:new", (newLead: Lead) => {
      setLeads((current) => {
        const exists = current.some((lead) => lead.id === newLead.id);
        return exists ? current : [newLead, ...current];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meta Leads PoC</Text>

      <Text style={styles.status}>
        {connected ? "Connected" : "Disconnected"}
      </Text>

      <Text style={styles.count}>
        Total Leads: {leads.length}
      </Text>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {item.name || "Unknown Name"}
            </Text>
            <Text>Email: {item.email || "Not provided"}</Text>
            <Text>Phone: {item.phone || "Not provided"}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No leads received yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 55,
    backgroundColor: "#f5f6fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  status: {
    marginBottom: 15,
  },
  count: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  empty: {
    color: "gray",
    textAlign: "center",
    marginTop: 40,
  },
});
