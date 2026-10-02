import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Button className=' bg-amber-300 mr-10'>
        <h1 className='shimmer-color-green-50'>
        Hello World
        </h1>
        </Button>
    </div>
  );
}
