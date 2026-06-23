import { Monitor, User, Warehouse } from "lucide-react";
import { Panel } from "./components";

interface Props {
  workspace?: { name?: string; timezone?: string };
  currentUser?: { name?: string; email?: string };
}

export function SettingsPage({ workspace, currentUser }: Props) {
  return (
    <div className="settings-simple-layout">
      <Panel title="Workspace">
        <div className="settings-simple-card">
          <Warehouse aria-hidden="true" />
          <label><span>Tên workspace</span><input value={workspace?.name ?? "Marketing Room"} readOnly /></label>
          <label><span>Múi giờ</span><input value={workspace?.timezone ?? "Asia/Ho_Chi_Minh"} readOnly /></label>
          <p>Chỉnh sửa workspace: <strong>Sắp có</strong></p>
        </div>
      </Panel>
      <Panel title="Tài khoản">
        <div className="settings-simple-card">
          <User aria-hidden="true" />
          <label><span>Tên hiển thị</span><input value={currentUser?.name ?? "Ngọc Dân"} readOnly /></label>
          <label><span>Email</span><input value={currentUser?.email ?? "ngocdanp0411@gmail.com"} readOnly /></label>
          <p>Thông tin đăng nhập đang dùng cổng mật khẩu nội bộ.</p>
        </div>
      </Panel>
      <Panel title="Giao diện">
        <div className="settings-simple-card">
          <Monitor aria-hidden="true" />
          <label><span>Theme</span><input value="Dark 1PM" readOnly /></label>
          <label><span>Chế độ gọn</span><input value="Sắp có" readOnly /></label>
          <p>Không có billing, team role hay tích hợp giả trong bản cá nhân này.</p>
        </div>
      </Panel>
    </div>
  );
}
