// 메인 페이지 로그인 버튼
document.getElementById("mainLoginButton").addEventListener("click", function () {
  // 모달을 표시하는 역할만 수행
  const modal = document.getElementById("loginModal");
  const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);
  bootstrapModal.show();
});

// 모달 내부 로그인 버튼
document.getElementById("modalLoginButton").addEventListener("click", async function () {
  // 입력된 로그인 정보 가져오기
  const loginId = document.getElementById("loginId").value;
  const loginPassword = document.getElementById("loginPassword").value;

  try {
    // 서버로 로그인 요청
    const response = await fetch("http://34.122.123.241:8369/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, loginPassword }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      switch (response.status) {
        case 401:
          alert("Invalid username or password.");
          break;
        case 500:
          alert("Internal server error. Please try again later.");
          break;
        default:
          alert(`Server error occurred. (HTTP ${response.status})`);
      }
      return;
    }

    // JSON 응답 처리
    const data = await response.json();
    console.log("Response data:", data);

    if (data.success) {
      // 로그인 성공 시 화면 갱신
      document.getElementById("loginStatus").innerHTML = `
        <div class="alert alert-success" role="alert">
          Welcome, ${data.user.name}! Role: ${data.user.role}
        </div>`;

      // 로그인/로그아웃 버튼 상태 업데이트
      document.getElementById("mainLoginButton").classList.add("d-none"); // 메인 로그인 버튼 숨기기
      document.getElementById("logoutButton").classList.remove("d-none"); // 로그아웃 버튼 보이기

      // 모달 닫기
      const modal = document.getElementById("loginModal");
      const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modal);
      bootstrapModal.hide();
    } else {
      alert("Login failed: " + (data.message || "Unknown error occurred"));
    }
  } catch (error) {
    console.error("Error during login:", error);
    alert("An error occurred. Please check your network or server status.");
  }
});

// 로그아웃 버튼
document.getElementById("logoutButton").addEventListener("click", function () {
  alert("You have been logged out.");
  document.getElementById("loginStatus").textContent = "";

  // 버튼 상태 업데이트
  document.getElementById("mainLoginButton").classList.remove("d-none"); // 메인 로그인 버튼 보이기
  document.getElementById("logoutButton").classList.add("d-none"); // 로그아웃 버튼 숨기기
});
