"use client";

import React, { useState, useEffect } from "react";
import { auth, storage, db } from "./firebaseConfig";
import { updateProfile, onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { message } from "antd";

import likedp  from "./likedProfile/likedp.jpg";
import savetob from "./likedProfile/savetob.jpg";
import "./profile.css";

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");
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
    const file = e.target.files[0];
    if (file && user) {
      const storageRef = ref(storage, `profilePics/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfilePicUrl(url);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      if (!user) throw new Error("User is not logged in");

      await updateProfile(user, { photoURL: profilePicUrl });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: profilePicUrl });

      messageApi.success("Profile updated successfully!");
    } catch (error) {
      messageApi.error("Error updating profile.");
      console.error("Error updating profile:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem("hasRefreshed");
      messageApi.success("You have logged out successfully!");
      router.push("/");
    } catch (error) {
      messageApi.error("Error logging out.");
      console.error("Error logging out:", error);
    }
  };

  if (!user) {
    return <p>Please log in to view your profile.</p>;
  }

  return (
    <div className="profile-container">

       {contextHolder} {/* ✅ Needed for antd message */}
      <div className="profile-info">
        <h2>Your Profile</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Username:</strong> {user.displayName || "N/A"}</p>

        <div>
          <label>Profile Picture:</label>
          <input type="file" accept="image/*" onChange={handleProfilePicChange} />
          {profilePicUrl && <img className="profile-pic" src={profilePicUrl} alt="Profile" />}
        </div>

        <button onClick={handleProfileUpdate}>Save Changes</button>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-visuals">
        <div className="section">
          <div className="section-title">❤️ Your liked items</div>
          <img className="section-img" src={likedp} alt="liked items" />
        </div>

        <div className="section">
          <div className="section-title">🛒 Your basket</div>
          <img className="section-img" src={savetob} alt="saved items" />
        </div>
      </div>
    </div>
  );
};

export default Profile;
