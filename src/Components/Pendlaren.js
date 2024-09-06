import React, { useState, useEffect } from "react";
import axios from "axios";

const Pendlaren = () => {
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(
    () => localStorage.getItem("selectedStopId") || null
  );
  const [timetable, setTimetable] = useState([]);
  const [error, setError] = useState(null);

  const ACCESS_ID = "cdd0293e-051f-4c38-b4fb-0cb0c8078c5e"; 

  useEffect(() => {
    const fetchLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          (err) => {
            console.error("Geolocation error:", err);
            setError("Unable to retrieve location.");
          }
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchNearbyStops = async () => {
      if (location.lat && location.lon) {
        const url = `https://api.resrobot.se/v2.1/location.nearbystops?accessId=${ACCESS_ID}&originCoordLat=${location.lat}&originCoordLong=${location.lon}&format=json`;
        console.log("Request URL for nearby stops:", url); // Log URL for debugging

        try {
          const response = await axios.get(url);
          setStops(response.data.stopLocationOrCoordLocation || []);
        } catch (error) {
          console.error("Error fetching nearby stops:", error);
          setError("Failed to fetch nearby stops.");
        }
      }
    };
    fetchNearbyStops();
  }, [location]);

  const fetchTimetable = async (stopId) => {
    const date = new Date().toISOString().split("T")[0]; // Current date in YYYY-MM-DD format
    const time = new Date().toTimeString().split(" ")[0].substring(0, 5); // Current time in HH:MM format

    const url = `https://api.resrobot.se/v2.1/departureBoard?id=${stopId}&date=${date}&time=${time}&format=json&accessId=${ACCESS_ID}`;
    console.log("Request URL for timetable:", url); // Log URL for debugging

    try {
      const response = await axios.get(url);
      console.log("Timetable response:", response.data); // Log the full response
      setTimetable(response.data.Departure || []); // Handle the response as expected
    } catch (error) {
      console.error("Error fetching timetable:", error);
      setError("Failed to fetch timetable.");
    }
  };

  const handleStopSelection = (stopId) => {
    setSelectedStop(stopId);
    localStorage.setItem("selectedStopId", stopId);
    fetchTimetable(stopId); // Call fetchTimetable asynchronously
  };

  useEffect(() => {
    if (selectedStop) {
      fetchTimetable(selectedStop);
    }
  }, [selectedStop]);

  return (
    <div>
      <h1>Pendlaren - Find Nearby Bus Stops</h1>
      <h2>Your Location</h2>
      {location.lat && location.lon ? (
        <p>
          Lat: {location.lat}, Lon: {location.lon}
        </p>
      ) : (
        <p>Fetching your location...</p>
      )}
      <h2>Nearby Bus Stops</h2>
      {error && <p style={{ color: "red" }}>{error}</p>} {/* Display error if exists */}
      {stops.length > 0 ? (
        <ul>
          {stops.map((stop, index) => (
            <li
              key={index}
              onClick={() => handleStopSelection(stop.StopLocation.id)}
            >
              {stop.StopLocation.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>No nearby stops found.</p>
      )}
      {selectedStop && timetable.length > 0 && (
        <div>
          <h2>Upcoming Departures</h2>
          <ul>
            {timetable.map((departure, index) => (
              <li key={index}>
                {departure.name} to {departure.direction} at {departure.time}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Pendlaren;
