import { useState } from "react";

export default function TestComponent() {
  const [editedProfile, setEditedProfile] = useState({ profileImage: "test.jpg" });

  // Remove profile picture - SIMPLIFIED VERSION
  const handleRemoveProfilePic = () => {
    setEditedProfile(prev => ({ ...prev, profileImage: "" }));
    localStorage.removeItem("parentProfileImage");
    alert("Profile picture removed!");
  };

  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={handleRemoveProfilePic}>
        Click to test function
      </button>
      <p>Current image: {editedProfile.profileImage || "none"}</p>
    </div>
  );
}
