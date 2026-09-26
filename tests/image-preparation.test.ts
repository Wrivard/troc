import { readImageBytes } from "../artifacts/api-server/src/modules/storage/read-image-bytes";
import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { prepareImage, imageLimits } from "../artifacts/api-server/src/modules/storage/prepare-image";
const fixture = () => sharp({create:{width:80,height:120,channels:3,background:"#9a3060"}});
test("supported raster files are fully decoded into bounded metadata-free WebP", async () => {
  for (const [format,mime] of [["jpeg","image/jpeg"],["png","image/png"],["webp","image/webp"]] as const) {
    const source = await fixture().toFormat(format).withMetadata({orientation:6}).toBuffer();
    const output = await prepareImage(source,mime), meta = await sharp(output.bytes).metadata();
    assert.equal(meta.format,"webp"); assert.equal(meta.exif,undefined); assert.equal(meta.orientation,undefined);
    assert.equal(output.width,120); assert.equal(output.height,80);
    assert.equal(output.sha256,createHash("sha256").update(output.bytes).digest("hex"));
  }
});
test("invalid size, spoofed MIME, corrupt files and active formats fail closed", async () => {
  await assert.rejects(()=>prepareImage(Buffer.alloc(0),"image/jpeg"),/image_size_invalid/);
  await assert.rejects(()=>prepareImage(Buffer.alloc(imageLimits.bytes+1),"image/png"),/image_size_invalid/);
  await assert.rejects(()=>prepareImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),"image/svg+xml"),/image_type_unsupported/);
  const png=await fixture().png().toBuffer();
  await assert.rejects(()=>prepareImage(png,"image/jpeg"),/image_type_mismatch/);
  await assert.rejects(()=>prepareImage(png.subarray(0,Math.floor(png.length/2)),"image/png"),/image_decode_failed/);
  await assert.rejects(()=>prepareImage(Buffer.from("not an image"),"image/webp"),/image_decode_failed/);
});
test("oversized pixel input is rejected; large valid files shrink without upscaling", async () => {
  const oversized=await sharp({create:{width:5000,height:5000,channels:3,background:"white"}}).png().toBuffer();
  await assert.rejects(()=>prepareImage(oversized,"image/png"),/image_decode_failed/);
  const wide=await sharp({create:{width:3000,height:1500,channels:3,background:"white"}}).png().toBuffer();
  const result=await prepareImage(wide,"image/png");assert.equal(result.width,2400);assert.equal(result.height,1200);
});

test("animated WebP is rejected instead of silently choosing a frame", async () => {
  const raw=Buffer.alloc(2*4*3,0);raw.fill(255,2*2*3);
  const animated=await sharp(raw,{raw:{width:2,height:4,channels:3,pageHeight:2}}).webp({loop:0,delay:[100,100]}).toBuffer();
  assert.equal((await sharp(animated,{animated:true}).metadata()).pages,2);
  await assert.rejects(()=>prepareImage(animated,"image/webp"),/image_animation_unsupported/);
});
test("decoder admission rejects excess work and releases slots after failure", async () => {
  const source=await fixture().png().toBuffer();
  const first=prepareImage(source,"image/png"),second=prepareImage(source,"image/png");
  await assert.rejects(()=>prepareImage(source,"image/png"),/image_processing_busy/);
  await Promise.all([first,second]);
  await assert.rejects(()=>prepareImage(Buffer.from("corrupt"),"image/png"),/image_decode_failed/);
  assert.equal((await prepareImage(source,"image/png")).width,80);
});

test("stream limits count actual bytes, close oversize streams and propagate transport errors", async () => {
  let closed=false,extraRead=false;
  async function* oversized(){try{yield Buffer.alloc(imageLimits.bytes);yield Buffer.from([1]);extraRead=true;yield Buffer.from([2]);}finally{closed=true;}}
  await assert.rejects(()=>readImageBytes(oversized()),/image_size_invalid/);
  assert.equal(closed,true);assert.equal(extraRead,false);
  async function* empty(){yield Buffer.alloc(0);}
  await assert.rejects(()=>readImageBytes(empty()),/image_size_invalid/);
  async function* broken(){yield Buffer.from([1]);throw new Error("transport interrupted");}
  await assert.rejects(()=>readImageBytes(broken()),/transport interrupted/);
  async function* reused(){const buffer=Buffer.from([1]);yield buffer;buffer[0]=2;yield buffer;}
  assert.deepEqual(await readImageBytes(reused()),Buffer.from([1,2]));
});
