"use client";

import React, { useState, useEffect } from "react";
import { auth, storage, db } from "./firebaseConfig";
import { updateProfile, onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { message } from "antd";
import "./profile.css";

const Profile = () => {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser?.photoURL) {
        setProfilePicUrl(currentUser.photoURL);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      messageApi.error("Please upload a valid image file.");
      return;
    }

    try {
      setIsUploading(true);
      setSelectedFile(file);

      const storageRef = ref(storage, `profilePics/${user.uid}`);
      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);
      setProfilePicUrl(url);

      messageApi.success("Image uploaded. Click save to update your profile.");
    } catch (error) {
      console.error("Image upload error:", error);
      messageApi.error("Could not upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      if (!user) throw new Error("User is not logged in");

      setIsSaving(true);

      await updateProfile(user, {
        photoURL: profilePicUrl,
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        photoURL: profilePicUrl,
      });

      messageApi.success("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      messageApi.error("Error updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("hasRefreshed");
      messageApi.success("Logged out successfully.");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      messageApi.error("Error logging out.");
    }
  };

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-empty-state">
          <h2>You are not logged in</h2>
          <p>Please log in to view and manage your profile.</p>
          <button onClick={() => router.push("/")}>Go to login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      {contextHolder}

      <section className="profile-header">
        <div>
          <p className="profile-eyebrow">Account Settings</p>
          <h1>Manage your profile</h1>
          <p>
            Update your profile picture and review your account information.
          </p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </section>

      <section className="profile-grid">
        <div className="profile-card account-card">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h2>{user.displayName || "Your Profile"}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="form-group">
            <label>Email address</label>
            <input value={user.email || ""} disabled />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input value={user.displayName || "Not set"} disabled />
          </div>

          <div className="upload-box">
            <div>
              <label>Profile image</label>
              <p>Upload a clear image to personalize your account.</p>
            </div>

            <label className="upload-button">
              {isUploading ? "Uploading..." : "Choose image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                hidden
              />
            </label>
          </div>

          {selectedFile && (
            <p className="file-name">Selected: {selectedFile.name}</p>
          )}

          <button
            className="save-button"
            onClick={handleProfileUpdate}
            disabled={isSaving || isUploading}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>

        <div className="profile-card shortcuts-card">
          <h2>Your activity</h2>
          <p className="card-description">
            Quickly jump back into the things you care about.
          </p>

          <div className="shortcut-item">
            <img
              src="https://cdn.malidag.com/themes/1777938103580-98a9b6b2-dd98-4a40-9b7e-7dbbc88b8050.webp"
              alt="Liked items"
            />
            <div>
              <h3>Liked items</h3>
              <p>View products and content you saved.</p>
            </div>
          </div>

          <div className="shortcut-item">
            <img
              src="https://cdn.malidag.com/themes/1777938140559-2643e175-6bbe-40b4-996d-5a637543b296.webp"
              alt="Basket"
            />
            <div>
              <h3>Your basket</h3>
              <p>Continue shopping from your cart.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profile;