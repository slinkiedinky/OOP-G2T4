"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import { getToken } from "../../lib/api";

export default function Clinics() {
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  // Extract unique types and locations from data
  const [clinicTypes, setClinicTypes] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${apiBase}/api/clinics`)
      .then((res) => res.json())
      .then((data) => {
        setClinics(data);
        setFilteredClinics(data);

        // Extract unique types
        const types = [
          "All",
          ...new Set(data.map((c) => c.clinicType).filter(Boolean)),
        ];
        setClinicTypes(types);

        // Extract unique locations
        const locs = [
          "All",
          ...new Set(data.map((c) => c.location).filter(Boolean)),
        ];
        setLocations(locs);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load clinics:", err);
        setLoading(false);
      });
  }, []);

  // Apply filters whenever any filter changes
  useEffect(() => {
    let filtered = [...clinics];

    // Filter by type
    if (selectedType !== "All") {
      filtered = filtered.filter((c) => c.clinicType === selectedType);
    }

    // Filter by location
    if (selectedLocation !== "All") {
      filtered = filtered.filter((c) => c.location === selectedLocation);
    }

    // Filter by search query (only search name, address, and ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((clinic) => {
        const name = (clinic.name || "").toLowerCase();
        const address = (clinic.address || "").toLowerCase();
        const id = String(clinic.id);

        return (
          name.includes(query) || address.includes(query) || id.includes(query)
        );
      });
    }

    setFilteredClinics(filtered);
  }, [searchQuery, selectedType, selectedLocation, clinics]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("All");
    setSelectedLocation("All");
  };

  const hasActiveFilters =
    searchQuery || selectedType !== "All" || selectedLocation !== "All";

  if (loading) {
    return (
      <div>
        <h2>Clinics</h2>
        <p style={{ color: "#666" }}>Loading clinics...</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <h2>Clinics</h2>
      {!isLoggedIn && (
        <p style={{ color: "#666", marginBottom: 16 }}>
          Please log in to view doctors
        </p>
      )}

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by clinic name, address, or ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ marginBottom: 2, maxWidth: 600 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Filter Pills */}
      <Box sx={{ marginBottom: 3 }}>
        {/* Clinic Type Filter */}
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#666",
              marginRight: 12,
            }}
          >
            Type:
          </span>
          {clinicTypes.map((type) => (
            <Chip
              key={type}
              label={type}
              onClick={() => setSelectedType(type)}
              color={selectedType === type ? "primary" : "default"}
              variant={selectedType === type ? "filled" : "outlined"}
              sx={{ marginRight: 1, marginBottom: 1 }}
            />
          ))}
        </div>

        {/* Location Filter */}
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#666",
              marginRight: 12,
            }}
          >
            Location:
          </span>
          {locations.map((loc) => (
            <Chip
              key={loc}
              label={loc}
              onClick={() => setSelectedLocation(loc)}
              color={selectedLocation === loc ? "primary" : "default"}
              variant={selectedLocation === loc ? "filled" : "outlined"}
              sx={{ marginRight: 1, marginBottom: 1 }}
            />
          ))}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            size="small"
            variant="text"
            color="secondary"
            onClick={handleClearFilters}
            sx={{ marginTop: 1 }}
          >
            Clear All Filters
          </Button>
        )}
      </Box>

      {/* Results Count */}
      <p style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
        {filteredClinics.length} clinic{filteredClinics.length !== 1 ? "s" : ""}{" "}
        found
      </p>

      {/* Clinics Grid */}
      {filteredClinics.length === 0 ? (
        <p style={{ color: "#999" }}>
          No clinics match your filters. Try adjusting your search or filters.
        </p>
      ) : (
        <div className="grid-cards">
          {filteredClinics.map((c) => (
            <Card key={c.id} className="card">
              <CardContent>
                <h3 className="card-title">{c.name}</h3>
                <p className="card-sub">{c.address}</p>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {c.location && (
                    <Chip
                      label={c.location}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {c.clinicType && (
                    <Chip
                      label={c.clinicType}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#8892a6", marginTop: 8 }}>
                  ID: {c.id}
                </p>
                <div style={{ marginTop: 12 }}>
                  {isLoggedIn ? (
                    <Link href={`/clinics/${c.id}`}>
                      <Button variant="contained" size="small">
                        View doctors
                      </Button>
                    </Link>
                  ) : (
                    <Tooltip title="Please log in to view doctors">
                      <span>
                        <Button variant="contained" size="small" disabled>
                          View doctors
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
