/**常去官网更新 */
import { station_names } from "../utils/station_name_new_v10063";
import React, { useState } from "react";
import { Button, DatePicker, Form, Input, Select, Table, message } from "antd";
const { Option } = Select;

function getStationOptions() {
  const stations = station_names.split("@");
  // 扔掉第一个
  stations.shift();
  return stations.map((station) => {
    const [none, label, value] = station.split("|");
    return {
      label,
      value,
    };
  });
}

const stationOptions = getStationOptions();

type Train = {
  key: string;

  train_no: string;
  code: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  start_time: string;
  arrive_time: string;

  // 商务座
  swz_num: string;
  // 一等座
  zy_num: string;
  // 二等座
  ze_num: string;
  // 无座
  wz_num: string;

  // 商务座 有票站点
  swz_has_ticket_station?: string;
  // 一等座 有票站点
  zy_has_ticket_station?: string;
  // 二等座 有票站点
  ze_has_ticket_station?: string;
  // 无座 有票站点
  wz_has_ticket_station?: string;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function getTrainByString(str: string): Train {
  const itemArr = str?.split("|") || [];

  return {
    key: itemArr[0],
    train_no: itemArr[2],
    code: itemArr[3],
    from: itemArr[6],
    fromName: stationOptions.find((item) => item.value === itemArr[6])
      ?.label as string,
    to: itemArr[7],
    toName: stationOptions.find((item) => item.value === itemArr[7])
      ?.label as string,
    start_time: itemArr[8],
    arrive_time: itemArr[9],

    // 商务座
    swz_num: itemArr[32],

    // 一等座
    zy_num: itemArr[31],

    // 二等座
    ze_num: itemArr[30],

    // 无座
    wz_num: itemArr[26],
  };
}

function hasTicket(str: string) {
  return str && str !== "无" && str !== "--";
}

export default () => {
  const [form] = Form.useForm();

  const [list, setList] = useState<Train[]>([]);

  const [loading, setLoading] = useState(false);

  async function onFinish(values: any) {
    values.train_date = values.train_date.format("YYYY-MM-DD");
    setLoading(true);
    const res = await fetch(`/api/leftTicketDTO`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const { data } = await res.json();

    if (!data) {
      message.error("初次请求失败");
      return;
    }

    await delay(1000);

    const trainList: Train[] = data.result.map((item: string) => {
      return getTrainByString(item);
    });

    // 过滤一下 code
    values.codes = (values.codes as string)?.trim();
    const codeList: string[] = (values.codes as string)?.split(",");
    const filterTrainList =
      !codeList || !codeList.length
        ? trainList
        : trainList.filter((train) => codeList.includes(train.code));


    for (const train of filterTrainList) {
      // 通过每个车次去查询经过站
      const res = await fetch(`/api/queryByTrainNo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          train_no: train.train_no,
          from_station_telecode: train.from,
          to_station_telecode: train.to,
          depart_date: values.train_date,
        }),
      });

      const { data } = await res.json();

      await delay(1000);

      // 通过经过站，查询到达最远的经过站，且有票，是哪一站
      await queryHasTicketAndMaxLongStation(data.data, train, values);
    }

    setLoading(false);
    setList(filterTrainList);
  }

  const columns = [
    {
      title: "车次",
      dataIndex: "code",
    },
    {
      title: "出发站",
      dataIndex: "fromName",
    },
    {
      title: "到达站",
      dataIndex: "toName",
    },
    {
      title: "出发时间",
      dataIndex: "start_time",
    },
    {
      title: "到达时间",
      dataIndex: "arrive_time",
    },
    {
      title: "商务座",
      dataIndex: "swz_num",
    },
    {
      title: "一等座",
      dataIndex: "zy_num",
    },
    {
      title: "二等座",
      dataIndex: "ze_num",
    },
    {
      title: "无座",
      dataIndex: "wz_num",
    },
    {
      title: "商务座 有票站点",
      dataIndex: "swz_has_ticket_station",
    },
    {
      title: "一等座 有票站点",
      dataIndex: "zy_has_ticket_station",
    },
    {
      title: "二等座 有票站点",
      dataIndex: "ze_has_ticket_station",
    },
    {
      title: "无座 有票站点",
      dataIndex: "wz_has_ticket_station",
    },
  ];

  return (
    <div>
      <Form
        form={form}
        name="control-hooks"
        onFinish={onFinish}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          name="from_station"
          label="起点"
          rules={[{ required: true }]}
        >
          <Select
            allowClear
            options={stationOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          ></Select>
        </Form.Item>

        <Form.Item name="to_station" label="终点" rules={[{ required: true }]}>
          <Select
            allowClear
            options={stationOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          ></Select>
        </Form.Item>

        <Form.Item name="train_date" label="日期" rules={[{ required: true }]}>
          <DatePicker />
        </Form.Item>

        <Form.Item name={"codes"} label={"车次,用英文逗号隔开"}>
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
      <Table loading={loading} columns={columns} dataSource={list} />
    </div>
  );
};

async function queryHasTicketAndMaxLongStation(
  data: any[],
  // 直接更改 train 的值
  train: Train,
  value: any
) {
  const startIndex = data.findIndex(
    (item) => item.station_name === train.fromName
  );

  const endIndex = data.findIndex((item) => item.station_name === train.toName);

  const inStations = data.slice(startIndex, endIndex + 1);

  // 起始站 - 起始站 无意义
  for (let i = inStations.length - 1; i >= 1; i--) {
    const to_station = stationOptions.find(
      (item) => item.label === inStations[i].station_name
    )?.value;
    if (!to_station) {
      message.error(`${inStations[i].station_name} 不存在，请联系管理员`);
      continue;
    }

    const res = await fetch(`/api/leftTicketDTO`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        train_date: value.train_date,
        from_station: train.from,
        to_station,
      }),
    });

    const { data } = await res.json();

    if (!data) {
      message.error(
        `${train.from}到${to_station} 查不到，请联系管理员，日期：${value.train_date}`
      );
      continue;
    }

    await delay(1000);

    // 找到本列车
    const trainData = data.result.find(
      (item: string) => getTrainByString(item).train_no === train.train_no
    );

    if (!trainData) {
      console.warn("data.result", data.result);
      continue;
    }

    const currentTrain = getTrainByString(trainData);
    if (!train.swz_has_ticket_station && hasTicket(currentTrain.swz_num)) {
      train.swz_has_ticket_station = inStations[i].station_name;
    }

    if (!train.zy_has_ticket_station && hasTicket(currentTrain.zy_num)) {
      train.zy_has_ticket_station = inStations[i].station_name;
    }

    if (!train.ze_has_ticket_station && hasTicket(currentTrain.ze_num)) {
      train.ze_has_ticket_station = inStations[i].station_name;
    }

    if (!train.wz_has_ticket_station && hasTicket(currentTrain.wz_num)) {
      train.wz_has_ticket_station = inStations[i].station_name;
    }

    if (
      train.swz_has_ticket_station &&
      train.zy_has_ticket_station &&
      train.ze_has_ticket_station &&
      train.wz_has_ticket_station
    ) {
      break;
    }
  }
}
