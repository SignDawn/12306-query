import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { from_station_telecode, to_station_telecode, depart_date, train_no } =
    req.body;

  const conf = await fetch("https://kyfw.12306.cn/index/otn/login/conf", {
    method: "POST",
  });

  const Cookie = conf.headers.get("set-cookie") as string;

  const ticketQuery = await fetch(
    `https://kyfw.12306.cn/otn/czxx/queryByTrainNo?train_no=${train_no}&from_station_telecode=${from_station_telecode}&to_station_telecode=${to_station_telecode}&depart_date=${depart_date}`,
    {
      method: "GET",
      headers: {
        Cookie,
      },
    }
  );
  const ticketData = await ticketQuery.json();
  res.status(200).json(ticketData);
};
