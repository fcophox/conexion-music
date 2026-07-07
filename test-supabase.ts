import { incrementLike, incrementPlay } from "./src/lib/catalog";
async function run() {
  console.log("likes", await incrementLike(101));
  console.log("plays", await incrementPlay(101));
}
run();
