import { StyleSheet, Text, View } from "react-native";
import { useEffect, useState, useRef } from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export default function Mapa() {
  // States utizados para as funções de "Location"
  const [myLocation, setMyLocation] = useState(null);
  const [location, setLocation] = useState(null);
  const [initialLocation, setInitialLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const mapViewRef = useRef(null);

  // States utilizados para a contagem de passos
  const [steps, setSteps] = useState(0);
  const [speed, setSpeed] = useState(0);

  // useEffect monitorando permissão do Location
  useEffect(() => {
    async function getLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permissão negada");
        return;
      }

      // Função para obter localização atual
      let currentLocation = await Location.getCurrentPositionAsync({});
      setMyLocation(currentLocation);
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Animação do mapa para localização atual
      mapViewRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
    getLocation();
  }, []);

  // Função de velocidade
  async function startMonitoringSpeed() {
    try {
      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 0,
          activityType: Location.ActivityType.Fitness,
        },

        (position) => {
          setSpeed(position.coords.speed || 0);
        }
      );

      return locationSubscription;
    } catch (error) {
      console.error(error);
    }
  }

  // Para o monitoramento da velocidade e remove a assinatura.
  async function stopMonitoringSpeed(subscription) {
    if (subscription) {
      subscription.remove();
    }
  }

  // Formula de Harvesine para calcular a distancia em metros
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * (Math.PI / 180); // Latitude em radianos
    const φ2 = lat2 * (Math.PI / 180); // Latitude em radianos
    const Δφ = (lat2 - lat1) * (Math.PI / 180); // Diferença de latitude em radianos
    const Δλ = (lon2 - lon1) * (Math.PI / 180); // Diferença de longitude em radianos

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  };

  return (
    <>
      <View style={styles.viewMapa}>
        <MapView
          ref={mapViewRef}
          mapType="standard"
          style={styles.mapa}
          region={location}
          followsUserLocation={true}
          showsUserLocation={true}
        >
          {initialLocation && <Marker coordinate={location} />}
        </MapView>
      </View>

      <View style={styles.viewDados}>
        <Text style={styles.distanceText}>
          {/* Distância percorrida: {(distance / 1000).toFixed(2)} km */}
          Distância percorrida: {steps.toFixed(2)}
        </Text>

        <Text style={styles.distanceText}>Velocidade: {speed.toFixed(2)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Mapa
  mapa: {
    width: 280,
    height: 280,
  },

  // Dados
  viewDados: {
    flexDirection: "row",
    gap: 30,
    marginTop: 10,
  },

  distanceText: {
    fontSize: 18,
    marginTop: 10,
  },
});
