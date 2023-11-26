"use client";
import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css'


export default async function IndexPage() {
  return (
    <div>
      <h1>tl;draw demo</h1>
      <div className="h-screen w-screen">
        <Tldraw />
      </div>
    </div>
  );
}
