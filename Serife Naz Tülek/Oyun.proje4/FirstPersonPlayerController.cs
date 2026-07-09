using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class FirstPersonPlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 4.5f;
    public float runSpeed = 7f;
    public float gravity = -22f;

    [Header("Jump / Step Help")]
    public float jumpForce = 6.5f;

    [Header("Mouse Look")]
    public float mouseSensitivity = 2.5f;
    public float maxLookAngle = 80f;

    private CharacterController controller;
    private Camera playerCamera;
    private float verticalVelocity;
    private float cameraPitch;

    void Awake()
    {
        controller = GetComponent<CharacterController>();
        playerCamera = GetComponentInChildren<Camera>();
    }

    void Start()
    {
        if (playerCamera == null)
        {
            Debug.LogError("Player içinde Camera yok.");
            enabled = false;
            return;
        }

        playerCamera.tag = "MainCamera";

        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    void Update()
    {
        HandleMouseLook();
        HandleMovement();
        HandleCursor();
    }

    void HandleMouseLook()
    {
        if (Cursor.lockState != CursorLockMode.Locked)
            return;

        float mouseX = Input.GetAxisRaw("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxisRaw("Mouse Y") * mouseSensitivity;

        transform.Rotate(0f, mouseX, 0f);

        cameraPitch -= mouseY;
        cameraPitch = Mathf.Clamp(cameraPitch, -maxLookAngle, maxLookAngle);

        playerCamera.transform.localRotation = Quaternion.Euler(cameraPitch, 0f, 0f);
    }

    void HandleMovement()
    {
        float x = 0f;
        float z = 0f;

        if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) z += 1f;
        if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) z -= 1f;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) x += 1f;
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) x -= 1f;

        Vector3 moveDirection = transform.right * x + transform.forward * z;
        moveDirection = Vector3.ClampMagnitude(moveDirection, 1f);

        float speed = Input.GetKey(KeyCode.LeftShift) ? runSpeed : moveSpeed;

        if (controller.isGrounded)
        {
            if (verticalVelocity < 0f)
                verticalVelocity = -2f;

            // Space = küçük zıplama / basamak çıkma yardımı
            if (Input.GetKeyDown(KeyCode.Space))
            {
                verticalVelocity = jumpForce;
            }
        }

        verticalVelocity += gravity * Time.deltaTime;

        Vector3 finalMove = moveDirection * speed;
        finalMove.y = verticalVelocity;

        controller.Move(finalMove * Time.deltaTime);
    }

    void HandleCursor()
    {
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;
        }

        if (Input.GetMouseButtonDown(0))
        {
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
    }
}