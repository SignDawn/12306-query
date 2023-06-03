import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { train_date, from_station, to_station } = req.body;

  const conf = await fetch("https://kyfw.12306.cn/index/otn/login/conf", {
    method: "POST",
  });

  const Cookie = conf.headers.get("set-cookie") as string;

  const ticketQuery = await fetch(
    `https://kyfw.12306.cn/otn/leftTicket/query?leftTicketDTO.train_date=${train_date}&leftTicketDTO.from_station=${from_station}&leftTicketDTO.to_station=${to_station}&purpose_codes=ADULT`,
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
