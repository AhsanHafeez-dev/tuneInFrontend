"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "../login/page.module.css"; // Reusing login styles
import apiClient from '@/utils/apiClient';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    userName: "",
    password: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    if (avatar) data.append("avatar", avatar);

    try {
      console.log(data);

      const res = await apiClient("/api/v1/users/register", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (res.ok) {
        router.push("/login");
      } else {
        setError(result.message || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Join AHtube</h1>
        <p>Create an account to start sharing</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={formData.userName}
            onChange={(e) =>
              setFormData({ ...formData, userName: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
          <div style={{ textAlign: "left" }}>
            <label
              style={{
                fontSize: "0.9rem",
                color: "var(--muted-foreground)",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Avatar
            </label>
            <input
              type="file"
              onChange={(e) => setAvatar(e.target.files[0])}
              accept="image/*"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
