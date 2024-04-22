import { NextApiRequest, NextApiResponse } from "next";
import {parse} from "~/utils/txParser";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const sharedText = req.query.text;
  if (typeof sharedText != "string") return res.redirect(302, "/");

  const tx = parse(sharedText);

  res.redirect(302, "/?tx=" + JSON.stringify(tx));
}

export type SharedTx = ReturnType<typeof parse>;
