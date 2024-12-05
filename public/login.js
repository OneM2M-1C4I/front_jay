document.getElementById("loginButton").addEventListener("click", async function () {
  // 입력된 로그인 정보 가져오기
  const loginId = document.getElementById("loginId").value;
  const loginPassword = document.getElementById("loginPassword").value;

  try {
    // 서버로 로그인 요청
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, loginPassword }),
    });

    // 상태 코드 확인
    console.log("Response status:", response.status);

    if (!response.ok) {
      // 서버가 200번대 응답을 주지 않을 때
      if (response.status === 401) {
        alert("아이디 또는 비밀번호가 잘못되었습니다.");
      } else {
        alert(`서버에서 오류가 발생했습니다. (HTTP ${response.status})`);
      }
      return;
    }

    // JSON 응답 처리
    const data = await response.json();

    if (data.success) {
      // 로그인 성공 시 화면 갱신
      document.getElementById("loginStatus").innerHTML = `
        <div class="alert alert-success" role="alert">
          환영합니다, ${data.user.name}님! 역할: ${data.user.role}
        </div>`;
      // 모달 닫기
      const modal = document.getElementById("loginModal");
      const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);
      bootstrapModal.hide();
    } else {
      // 로그인 실패 시 메시지 표시
      alert("로그인 실패: " + data.message);
    }
  } catch (error) {
    // 네트워크 또는 기타 오류 처리
    console.error("Error during login:", error);
    alert("로그인 중 문제가 발생했습니다. 네트워크 또는 서버 상태를 확인해주세요.");
  }
});
