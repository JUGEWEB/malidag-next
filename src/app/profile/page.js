import Profile from "@/components/profile";


// This is still a server component
export default function ProfilePage() {
  return (
    <div className="p-6">
      {/* Profile itself is a client component */}
      <Profile />
    </div>
  );
}
