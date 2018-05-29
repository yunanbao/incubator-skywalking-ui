/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import React, { PureComponent } from 'react';
import { Button, Row, Col, Divider, Form, DatePicker, Select } from 'antd';
import moment from 'moment';
import styles from './index.less';

const { Option } = Select;
const FormItem = Form.Item;
const { RangePicker } = DatePicker;

@Form.create({
  mapPropsToFields(props) {
    if (!props.selected) return {};
    const result = {
      step: Form.createFormField({
        value: props.selected.step,
      }),
    };
    if (props.selected.label) {
      return result;
    }
    result['range-time-picker'] = Form.createFormField({
      value: [props.selected.from(), props.selected.to()],
    });
    return result;
  },
})
class DurationPanel extends PureComponent {
  constructor(props) {
    super(props);

    const now = {
      to() {
        return moment();
      },
    };
    this.shortcuts = [
      { ...now,
        from() {
          return moment().subtract(15, 'minutes');
        },
        label: '最新15分钟',
      },
      { ...now,
        from() {
          return moment().subtract(30, 'minutes');
        },
        label: '最新30分钟',
      },
      { ...now,
        from() {
          return moment().subtract(1, 'hours');
        },
        label: '最新1小时',
      },
      { ...now,
        from() {
          return moment().subtract(6, 'hours');
        },
        label: '最新6小时',
      },
      { ...now,
        from() {
          return moment().subtract(12, 'hours');
        },
        label: '最新12小时',
      },
      { ...now,
        from() {
          return moment().subtract(24, 'hours');
        },
        label: '最新24小时',
      },
    ];
    this.shortcutsDays = [
      { ...now,
        from() {
          return moment().subtract(2, 'days');
        },
        label: '最新2天',
      },
      { ...now,
        from() {
          return moment().subtract(7, 'days');
        },
        label: '最新7天',
      },
      { ...now,
        from() {
          return moment().subtract(14, 'days');
        },
        label: '最新14天',
      },
      { ...now,
        from() {
          return moment().subtract(30, 'days');
        },
        label: '最新30天',
      },
      { ...now,
        from() {
          return moment().subtract(6, 'months');
        },
        label: '最新6个月',
      },
      { ...now,
        from() {
          return moment().subtract(12, 'months');
        },
        label: '最新12个月',
      },
    ];
  }
  componentDidMount() {
    const { onSelected } = this.props;
    onSelected(this.shortcuts[0]);
  }
  disabledDate = (current) => {
    return current && current.valueOf() >= Date.now();
  }
  handleSubmit = (e) => {
    e.preventDefault();

    const { form } = this.props;

    form.validateFields((err, fieldsValue) => {
      if (err) return;
      const selectedTime = {};
      for (const key of Object.keys(fieldsValue)) {
        if (fieldsValue[key]) {
          if (key === 'range-time-picker') {
            selectedTime.from = () => fieldsValue[key][0];
            selectedTime.to = () => fieldsValue[key][1];
          } else {
            selectedTime[key] = fieldsValue[key];
          }
        }
      }
      if (selectedTime.from && selectedTime.to) {
        this.select({ ...selectedTime, label: null });
      } else {
        this.select(selectedTime);
      }
    });
  }
  select = (newSelectedTime) => {
    const { onSelected, selected } = this.props;
    onSelected({ ...selected, ...newSelectedTime });
  }
  render() {
    const { collapsed, form } = this.props;
    if (collapsed) {
      return null;
    }
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 7 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 12 },
        md: { span: 10 },
      },
    };
    const { getFieldDecorator } = form;
    const content = (
      <Row type="flex" justify="end">
        <Col xs={24} sm={24} md={24} lg={15} xl={14}>
          <Form
            onSubmit={this.handleSubmit}
            hideRequiredMark
          >
            <FormItem
              {...formItemLayout}
              label="时间范围"
            >
              {getFieldDecorator('range-time-picker')(
                <RangePicker showTime disabledDate={this.disabledDate} format="YYYY-MM-DD HH:mm" />
              )}
            </FormItem>
            <FormItem
              {...formItemLayout}
              label="自动刷新"
            >
              {getFieldDecorator('step')(
                <Select style={{ width: 170 }}>
                  <Option value="0">关闭</Option>
                  <Option value="5000">5秒</Option>
                  <Option value="10000">10秒</Option>
                  <Option value="30000">30秒</Option>
                </Select>
              )}
            </FormItem>
            <FormItem
              wrapperCol={{ offset: 7 }}
            >
              <Button
                type="primary"
                htmlType="submit"
              >
                确定
              </Button>
            </FormItem>
          </Form>
        </Col>
        <Col xs={0} sm={0} md={0} lg={0} xl={1}><Divider type="vertical" style={{ height: 200 }} /></Col>
        <Col xs={24} sm={24} md={4} lg={4} xl={4}>
          <ul className={styles.list}>
            {this.shortcutsDays.map(d => (
              <li key={d.label}>
                <a onClick={this.select.bind(this, d)}>
                  {d.label}
                </a>
              </li>))
            }
          </ul>
        </Col>
        <Col xs={24} sm={24} md={4} lg={4} xl={4}>
          <ul className={styles.list}>
            {this.shortcuts.map(d => (
              <li key={d.label}>
                <a onClick={this.select.bind(this, d)}>
                  {d.label}
                </a>
              </li>))
            }
          </ul>
        </Col>
      </Row>
    );
    return (
      <div className={styles.pageHeader}>
        <div className={styles.detail}>
          <div className={styles.main}>
            <div className={styles.row}>
              <div className={styles.content}>
                {content}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default DurationPanel;
