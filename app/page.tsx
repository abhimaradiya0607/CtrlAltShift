import { Button } from "@/components/ui/button";
import UserButton from "@/features/auth/components/UserButton";

export default function Home() {
  return (
    <div>
          <Button className=' bg-amber-300 mr-10'>
            <h1 className='shimmer-color-green-50'>
            Hello World
            </h1>
        </Button>
        <UserButton />
    </div>
  );
}
